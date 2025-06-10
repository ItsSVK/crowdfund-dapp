import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Campaign } from '@/types/campaign';
import { useState } from 'react';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { useCampaigns } from '@/hooks/useCampaigns';
import * as anchor from '@coral-xyz/anchor';
import { toast } from 'sonner';
import { errorMessages } from '@/lib/errorMessages';

interface ClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
}

export function ClaimModal({ open, onOpenChange, campaign }: ClaimModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const { program, provider } = useAnchorProgram();
  const { refreshCampaigns } = useCampaigns();

  const campaignStatus = campaign?.account.campaignStatus();
  if (campaignStatus?.status === 'Active' || isClaimed) return;

  const handleProceedClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;
    setIsLoading(true);

    try {
      if (!program || !provider || !provider.wallet.publicKey)
        throw new Error('Wallet not connected');

      if (campaignStatus?.status === 'Active') {
        throw new Error('Campaign is still active');
      }

      const [contributor_recordPda] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from('contributor'),
            campaign?.publicKey?.toBuffer(),
            provider?.wallet?.publicKey?.toBuffer(),
          ],
          program?.programId
        );

      const [treasuryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('treasury'), campaign?.publicKey?.toBuffer()],
        program?.programId
      );

      const accounts = {
        campaign: campaign.publicKey,
      };
      if (campaignStatus?.status === 'Cancelled') {
        if (campaignStatus?.isContributed) {
          // withdraw if cancelled
          await program.methods
            .withdrawIfCancelled()
            .accounts({
              ...accounts,
              contributorRecord: contributor_recordPda,
              contributor: provider.wallet.publicKey,
              treasury: treasuryPda,
            })
            .rpc();
        } else {
          throw new Error('You have not contributed to this campaign');
        }
      } else {
        if (campaignStatus?.isGoalReached && campaignStatus?.amITheOwner) {
          // withdraw by owner
          await program.methods
            .withdrawByOwner()
            .accounts({
              ...accounts,
              owner: provider.wallet.publicKey,
              treasury: treasuryPda,
            })
            .rpc();
        } else if (
          !campaignStatus?.isGoalReached &&
          campaignStatus?.isContributed
        ) {
          // withdraw if failed
          await program.methods
            .withdrawIfFailed()
            .accounts({
              ...accounts,
              contributorRecord: contributor_recordPda,
              contributor: provider.wallet.publicKey,
              treasury: treasuryPda,
            })
            .rpc();
        } else {
          throw new Error('You have not contributed to this campaign');
        }
      }

      toast.success('Funds transaction sent!', {
        description: 'Your request has been sent to the network.',
      });
      onOpenChange(false);
      refreshCampaigns();
      setIsClaimed(true);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim Campaign Funds</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <span>
            Are you sure you want to claim your funds from this campaign?
            <br />
            <span className="font-bold">{campaign?.account.name}</span>
          </span>
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={handleProceedClaim}
            disabled={isLoading}
            className="cursor-pointer text-white"
          >
            {isLoading ? 'Processing...' : 'Proceed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
