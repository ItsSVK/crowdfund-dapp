import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActiveFilter, Campaign } from '@/types/campaign';
import { useState } from 'react';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { useCampaigns } from '@/hooks/useCampaigns';
import * as anchor from '@coral-xyz/anchor';
import { toast } from 'sonner';
import { errorMessages } from '@/lib/errorMessages';

interface CancelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
}

export function CancelModal({
  open,
  onOpenChange,
  campaign,
}: CancelModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const { program, provider } = useAnchorProgram();
  const { refreshCampaigns } = useCampaigns();

  const campaignStatus = campaign?.account.campaignStatus();
  if (campaignStatus?.status !== ActiveFilter.Active || isCancelled) return;

  const handleCancelCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;
    setIsLoading(true);

    try {
      if (!program || !provider || !provider.wallet.publicKey)
        throw new Error('Wallet not connected');

      if (campaignStatus?.status === ActiveFilter.Cancelled) {
        toast.error('Campaign has already been cancelled');
        return;
      }

      if (campaignStatus?.status === ActiveFilter.Past) {
        toast.error('Campaign has already ended');
        return;
      }

      await program.methods
        .cancelCampaign()
        .accounts({
          campaign: campaign.publicKey,
          owner: provider.wallet.publicKey,
        })
        .rpc();

      toast.success('Campaign has been cancelled!');
      onOpenChange(false);
      setIsCancelled(true);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Campaign</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <span>
            Are you sure you want to cancel this campaign?
            <br />
            <br />
            <span className="text-sm">
              Campaign:{' '}
              <span className="font-bold">{campaign?.account.name}</span>
              <br />
              This campaign has raised{' '}
              <span className="font-bold">
                {campaign?.account.totalAmountDonated.toNumber() /
                  anchor.web3.LAMPORTS_PER_SOL}{' '}
                SOL{' '}
              </span>
              so far.
            </span>
          </span>
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={handleCancelCampaign}
            disabled={isLoading}
            className="cursor-pointer !dark:text-white bg-destructive hover:bg-destructive/90"
            variant="destructive"
          >
            {isLoading ? 'Processing...' : 'Cancel Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
