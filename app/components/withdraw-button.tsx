'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface WithdrawButtonProps {
  campaignId: string;
}

export function WithdrawButton({ campaignId }: WithdrawButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleWithdraw = async () => {
    setIsLoading(true);

    try {
      // TODO: Integrate with Anchor program to withdraw contribution
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Withdrawal Successful!', {
        description: 'Your contribution has been returned to your wallet.',
      });
    } catch (error) {
      toast.error('Withdrawal Failed', {
        description: 'Please try again or check your wallet connection.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleWithdraw}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          Withdrawing...
        </motion.div>
      ) : (
        <>
          <ArrowDown className="mr-2 h-4 w-4" />
          Withdraw
        </>
      )}
    </Button>
  );
}
