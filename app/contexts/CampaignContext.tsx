'use client';

import React, { createContext, useState, useEffect } from 'react';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { useWallet } from '@solana/wallet-adapter-react';
import { Campaign, ContributorRecord } from '@/types/campaign';
import { PublicKey } from '@solana/web3.js';
import { errorMessages } from '@/lib/errorMessages';
import { toast } from 'sonner';
import * as anchor from '@coral-xyz/anchor';

interface CampaignContextType {
  campaigns: Campaign[];
  loading: boolean;
  connected: boolean;
  publicKey: PublicKey | null;
  refreshCampaigns: () => Promise<void>;
}

export const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined
);

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const { program } = useAnchorProgram();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      await refreshCampaigns();
    };
    fetchCampaigns();
  }, [program, publicKey]);

  useEffect(() => {
    if (!connected) {
      setCampaigns([]);
    }
  }, [connected]);

  const refreshCampaigns = async () => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);
      const campaignAccounts = await (program.account as any).campaign.all();
      const userContributions = await (
        program.account as any
      ).contributorRecord.all([
        {
          memcmp: {
            offset: 40,
            bytes: publicKey.toBase58(),
          },
        },
      ]);

      const formattedCampaigns = campaignAccounts.map((campaign: Campaign) => ({
        publicKey: campaign.publicKey,
        account: {
          name: campaign.account.name,
          description: campaign.account.description,
          owner: campaign.account.owner,
          goal: campaign.account.goal,
          deadline: campaign.account.deadline,
          totalAmountDonated: campaign.account.totalAmountDonated,
          withdrawnByOwner: campaign.account.withdrawnByOwner,
          treasury: campaign.account.treasury,
          isCancelled: campaign.account.isCancelled,
          campaignStatus: () => {
            const isContributed = userContributions.find(
              (contribution: ContributorRecord) =>
                contribution.account.campaign.toBase58() ===
                campaign.publicKey.toBase58()
            );
            const isGoalReached =
              campaign.account.totalAmountDonated.toNumber() >=
              campaign.account.goal.toNumber();
            const amITheOwner =
              campaign.account.owner.toBase58() === publicKey?.toBase58();
            if (campaign.account.isCancelled)
              return {
                status: 'Cancelled',
                color: 'bg-red-500',
                btnText: isContributed ? 'Claim' : 'Canceled',
                disabled: !isContributed,
                isContributed,
                isGoalReached,
                amITheOwner,
              };
            if (campaign.account.deadline?.toNumber() >= Date.now() / 1000)
              return {
                status: 'Active',
                color: 'bg-blue-500',
                btnText: 'Contribute',
                disabled: false,
                isContributed,
                isGoalReached,
                amITheOwner,
              };
            if (campaign.account.deadline?.toNumber() < Date.now() / 1000)
              return {
                status: 'Past',
                color: 'bg-emerald-500',
                btnText: isGoalReached
                  ? amITheOwner
                    ? 'Withdraw'
                    : 'Completed'
                  : isContributed
                  ? 'Claim'
                  : 'Completed',
                disabled: isGoalReached
                  ? amITheOwner
                    ? false
                    : true
                  : isContributed
                  ? false
                  : true,
                isContributed,
                isGoalReached,
                amITheOwner,
              };
            return {
              status: 'Active',
              color: 'bg-blue-500',
              btnText: 'Contribute',
              disabled: false,
              isContributed,
              isGoalReached,
              amITheOwner,
            };
          },
        },
      }));

      console.log('Campaigns Updated...');
      setCampaigns(formattedCampaigns);
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
      setLoading(false);
    }
  };

  return (
    <CampaignContext.Provider
      value={{ campaigns, loading, connected, publicKey, refreshCampaigns }}
    >
      {children}
    </CampaignContext.Provider>
  );
}
