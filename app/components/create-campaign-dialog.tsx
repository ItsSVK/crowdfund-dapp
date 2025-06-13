'use client';

import type React from 'react';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, FileText, Target } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import * as anchor from '@coral-xyz/anchor';
import { SystemProgram } from '@solana/web3.js';
import { z } from 'zod';
import { useCampaigns } from '@/hooks/useCampaigns';
import { errorMessages } from '@/lib/errorMessages';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Max 50 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Max 500 characters'),
  goal: z
    .string()
    .min(1, 'Goal is required')
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0.1, {
      message: 'Goal must be at least 0.1 SOL',
    }),
  deadline: z
    .string()
    .min(1, 'Deadline is required')
    .refine(
      val => {
        const d = new Date(val);
        return d.toString() !== 'Invalid Date' && d > new Date();
      },
      { message: 'Deadline must be a valid future date and time' }
    ),
});

export function CreateCampaignDialog({
  open,
  onOpenChange,
}: CreateCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: '',
    deadline: '',
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof typeof formData, string>>
  >({});
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const validate = (data: typeof formData) => {
    const result = campaignSchema.safeParse(data);
    if (!result.success) {
      const errors: Partial<Record<keyof typeof formData, string>> = {};
      for (const err of result.error.errors) {
        const field = err.path[0] as keyof typeof formData;
        errors[field] = err.message;
      }
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  const validateField = (field: keyof typeof formData, value: string) => {
    const testData = { ...formData, [field]: value };
    const result = campaignSchema.safeParse(testData);

    if (!result.success) {
      const fieldError = result.error.errors.find(err => err.path[0] === field);
      if (fieldError) {
        setFormErrors(prev => ({ ...prev, [field]: fieldError.message }));
      }
    } else {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'description' && descriptionRef.current) {
        descriptionRef.current.style.height = 'auto';
        descriptionRef.current.style.height =
          descriptionRef.current.scrollHeight + 'px';
      }
      return updated;
    });
  };

  const handleInputBlur = (field: keyof typeof formData) => {
    validateField(field, formData[field]);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    const dateString = date ? date.toISOString() : '';
    setFormData(prev => ({ ...prev, deadline: dateString }));
    // Validate immediately for date picker since it doesn't have traditional blur
    if (date) {
      validateField('deadline', dateString);
    }
  };

  const { program, provider } = useAnchorProgram();
  const { refreshCampaigns } = useCampaigns();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(formData)) return;
    setIsLoading(true);

    try {
      if (!program || !provider || !provider.wallet.publicKey)
        throw new Error('Wallet not connected');

      const goal = parseFloat(formData.goal);
      const goalLamports = new anchor.BN(goal * anchor.web3.LAMPORTS_PER_SOL);
      const deadlineTs = formData.deadline
        ? new anchor.BN(
            Math.floor(new Date(formData.deadline).getTime() / 1000)
          )
        : null;

      const createdAt = Math.floor(Date.now() / 1000);
      const createdAtBn = new anchor.BN(createdAt);

      // Derive PDAs
      const [campaignPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from('campaign'),
          provider.wallet.publicKey.toBuffer(),
          createdAtBn.toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      );

      const [treasuryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('treasury'), campaignPda.toBuffer()],
        program.programId
      );

      await program.methods
        .createCampaign(
          formData.name,
          formData.description,
          goalLamports,
          deadlineTs,
          createdAtBn
        )
        .accounts({
          campaign: campaignPda,
          owner: provider.wallet.publicKey,
          treasury: treasuryPda,
          system_program: SystemProgram.programId,
        })
        .rpc();

      toast.success('Campaign Created!', {
        description:
          'Your campaign has been successfully created and is now live.',
      });
      onOpenChange(false);
      setFormData({ name: '', description: '', goal: '', deadline: '' });
      setSelectedDate(null);
    } catch (error) {
      console.error('Full error:', error);

      if (error instanceof anchor.AnchorError) {
        console.error('Anchor error:', error);
        toast.error(
          errorMessages[
            error.error.errorCode.code as keyof typeof errorMessages
          ]
        );
      }

      if (error instanceof Error && 'transactionLogs' in error) {
        console.error('Transaction logs:', error.transactionLogs);
      }
    } finally {
      setIsLoading(false);
      refreshCampaigns();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Create New Campaign
              </DialogTitle>
              <DialogDescription>
                Launch your crowdfunding campaign on the Solana blockchain
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Campaign Name (50 characters max)
              </Label>
              <Input
                id="name"
                placeholder="Enter campaign name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                onBlur={() => handleInputBlur('name')}
                className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
              />
              {formErrors.name && (
                <div className="text-xs text-red-500 mt-1">
                  {formErrors.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description (500 characters max)
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your campaign and what you're raising funds for"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                onBlur={() => handleInputBlur('description')}
                rows={1}
                ref={descriptionRef}
                className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
              />
              {formErrors.description && (
                <div className="text-xs text-red-500 mt-1">
                  {formErrors.description}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <div className="space-y-2 flex-1/4">
                <Label htmlFor="goal" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goal (SOL)
                </Label>
                <Input
                  id="goal"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="10.0"
                  value={formData.goal}
                  onChange={e => handleInputChange('goal', e.target.value)}
                  onBlur={() => handleInputBlur('goal')}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 no-spinner"
                />
                {formErrors.goal && (
                  <div className="text-xs text-red-500 mt-1">
                    {formErrors.goal}
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-3/4">
                <Label htmlFor="deadline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Deadline
                </Label>
                <DateTimePicker
                  value={selectedDate}
                  onChange={handleDateChange}
                  placeholder="Select campaign deadline"
                  minDate={new Date(Date.now() + 60000)}
                  className="transition-all duration-200 focus-within:ring-purple-500/20"
                />
                {formErrors.deadline && (
                  <div className="text-xs text-red-500 mt-1">
                    {formErrors.deadline}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 cursor-pointer dark:text-white"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 cursor-pointer"
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent text-white" />
                      Creating...
                    </motion.div>
                  ) : (
                    <motion.span
                      key="create"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-white"
                    >
                      Create Campaign
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
      <style jsx global>{`
        /* Remove arrows from number input for all browsers */
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
    </Dialog>
  );
}
