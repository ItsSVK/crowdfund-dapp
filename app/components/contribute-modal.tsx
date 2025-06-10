'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';
import { Wallet, Target, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCampaigns } from '@/hooks/useCampaigns';
import { errorMessages } from '@/lib/errorMessages';

interface Campaign {
  publicKey: anchor.web3.PublicKey;
  account: {
    name: string;
    description: string;
    owner: anchor.web3.PublicKey;
    goal: anchor.BN;
    deadline: anchor.BN | null;
    totalAmountDonated: anchor.BN;
    withdrawnByOwner: boolean;
    treasury: anchor.web3.PublicKey;
    isCancelled: boolean;
    campaignStatus?: () => {
      status: string;
      color: string;
      btnText: string;
      disabled: boolean;
    };
  };
}

interface ContributeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
}

export function ContributeModal({
  open,
  onOpenChange,
  campaign,
}: ContributeModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { program } = useAnchorProgram();
  const { publicKey } = useWallet();
  const { refreshCampaigns } = useCampaigns();

  // Helper functions
  const formatSOL = (lamports: anchor.BN) => {
    return (lamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(2);
  };

  const formatDate = (timestamp: anchor.BN | null) => {
    if (!timestamp) return 'No deadline';
    return new Date(timestamp.toNumber() * 1000).toLocaleDateString();
  };
  const getProgress = (raised: anchor.BN, goal: anchor.BN) => {
    return (raised.toNumber() / goal.toNumber()) * 100;
  };

  const handleContribute = async () => {
    if (!program || !publicKey || !campaign || !amount) {
      toast.error('Missing required information');
      return;
    }

    const contributionAmount = parseFloat(amount);
    if (contributionAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);

      // Convert SOL to lamports
      const lamports = contributionAmount * anchor.web3.LAMPORTS_PER_SOL;

      // TODO: Replace this with your actual smart contract method
      // This is a placeholder - you'll need to implement the actual contribution logic
      // Example of how it might look:
      await program.methods
        .donateToCampaign(new anchor.BN(lamports))
        .accounts({
          campaign: campaign.publicKey,
          contributor: publicKey,
          treasury: campaign.account.treasury,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Placeholder success simulation
      // await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(`Successfully contributed ${amount} SOL!`);
      setAmount('');
      onOpenChange(false);
      refreshCampaigns();
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
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setAmount('');
      onOpenChange(false);
    }
  };

  if (!campaign) return null;

  const progress = getProgress(
    campaign.account.totalAmountDonated,
    campaign.account.goal
  );
  const remainingAmount =
    (campaign.account.goal.toNumber() -
      campaign.account.totalAmountDonated.toNumber()) /
    anchor.web3.LAMPORTS_PER_SOL;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Contribute to Campaign
          </DialogTitle>
          <DialogDescription>
            Support this campaign by making a contribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2 line-clamp-1">
              {campaign.account.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {campaign.account.description}
            </p>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {formatSOL(campaign.account.totalAmountDonated)} SOL raised
                </span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Goal: {formatSOL(campaign.account.goal)} SOL</span>
                {remainingAmount > 0 ? (
                  <span>Remaining: {remainingAmount.toFixed(2)} SOL</span>
                ) : (
                  <span>Goal Reached</span>
                )}
              </div>
            </div>

            {/* Campaign Details */}
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Deadline: {formatDate(campaign.account.deadline)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="truncate">
                  Owner: {campaign.account.owner.toBase58().slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          {/* Contribution Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium">
                Contribution Amount (SOL)
              </Label>
              <div className="mt-1">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                  className="text-lg"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum contribution: 0.01 SOL
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[0.1, 0.5, 1.0, 5.0].map(value => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(value.toString())}
                  disabled={isLoading}
                  className="text-xs cursor-pointer"
                >
                  {value} SOL
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer text-white"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 cursor-pointer text-white"
              onClick={handleContribute}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Contributing...
                </>
              ) : (
                <>
                  Contribute {amount || '0'} SOL
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
