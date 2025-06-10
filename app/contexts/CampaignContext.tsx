'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
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
  deadlineTimestamp: number;
}

export const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined
);

// Helper function to compare campaign data for changes
function campaignDataChanged(
  oldCampaign: Campaign,
  newCampaign: Campaign
): boolean {
  return (
    oldCampaign.account.name !== newCampaign.account.name ||
    oldCampaign.account.description !== newCampaign.account.description ||
    !oldCampaign.account.goal.eq(newCampaign.account.goal) ||
    !oldCampaign.account.deadline?.eq(newCampaign.account.deadline) ||
    !oldCampaign.account.totalAmountDonated.eq(
      newCampaign.account.totalAmountDonated
    ) ||
    oldCampaign.account.withdrawnByOwner !==
      newCampaign.account.withdrawnByOwner ||
    !oldCampaign.account.createdAt.eq(newCampaign.account.createdAt) ||
    oldCampaign.account.isCancelled !== newCampaign.account.isCancelled
  );
}

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const { program } = useAnchorProgram();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lastPublicKey, setLastPublicKey] = useState<string | null>(null);
  const [deadlineTimestamp, setDeadlineTimestamp] = useState(Date.now());

  useEffect(() => {
    const fetchCampaigns = async () => {
      await refreshCampaigns();
    };
    fetchCampaigns();
  }, [program, publicKey]);

  useEffect(() => {
    if (!connected) {
      setCampaigns([]);
      setLastPublicKey(null);
    }
  }, [connected]);

  // Separate timer for deadline checking (every 1 second)
  useEffect(() => {
    const deadlineTimer = setInterval(() => {
      const now = Date.now();

      // Force a re-render of campaign status functions by updating the timestamp
      // This will make buttons react immediately when deadlines expire
      setCampaigns(currentCampaigns => {
        const hasExpiredCampaigns = currentCampaigns.some(campaign => {
          const deadline = campaign.account.deadline?.toNumber() * 1000; // Convert to milliseconds
          const wasActive = deadline && deadline > now - 1000; // Was active 1 second ago
          const isNowExpired = deadline && deadline <= now; // Is expired now
          return wasActive && isNowExpired;
        });

        if (hasExpiredCampaigns) {
          console.log('Campaign deadline expired - updating button states');
          // Update timestamp to force re-renders of components that depend on campaign status
          setDeadlineTimestamp(now);
          // Return a new array to trigger re-render, but preserve object references
          return [...currentCampaigns];
        }

        return currentCampaigns;
      });
    }, 1000); // Check every 1 second

    return () => clearInterval(deadlineTimer);
  }, []);

  const refreshCampaigns = useCallback(async () => {
    if (!program || !publicKey) return;
    try {
      // Only set loading to true if we have no campaigns (initial load)
      // Don't show loading spinner for background refreshes
      if (campaigns.length === 0) {
        setLoading(true);
      }

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

      const formattedCampaigns = campaignAccounts
        .map((campaign: Campaign) => ({
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
            createdAt: campaign.account.createdAt,
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
        }))
        // Sort campaigns by creation time (newest first)
        .sort(
          (a: Campaign, b: Campaign) =>
            b.account.createdAt.toNumber() - a.account.createdAt.toNumber()
        );

      // Smart update: only update campaigns that have actually changed
      setCampaigns(currentCampaigns => {
        const currentPublicKeyString = publicKey.toBase58();

        // Check if publicKey has changed - if so, force complete refresh
        // because user's relationship to all campaigns has changed
        if (lastPublicKey && lastPublicKey !== currentPublicKeyString) {
          console.log('PublicKey changed - forcing complete campaign refresh');
          setLastPublicKey(currentPublicKeyString);
          return formattedCampaigns;
        }

        // Set the current publicKey for future comparisons
        if (!lastPublicKey) {
          setLastPublicKey(currentPublicKeyString);
        }

        // If no campaigns exist, return the new ones
        if (currentCampaigns.length === 0) {
          console.log('Campaigns Updated (initial load)...');
          return formattedCampaigns;
        }

        let hasChanges = false;
        const updatedCampaigns = formattedCampaigns.map(
          (newCampaign: Campaign) => {
            const existingCampaign = currentCampaigns.find(
              existing =>
                existing.publicKey.toBase58() ===
                newCampaign.publicKey.toBase58()
            );

            // If campaign doesn't exist or has changed, use new data
            if (
              !existingCampaign ||
              campaignDataChanged(existingCampaign, newCampaign)
            ) {
              hasChanges = true;
              return newCampaign;
            }

            // Campaign exists and hasn't changed, preserve the existing object reference
            return existingCampaign;
          }
        );

        // Check if any campaigns were added or removed
        if (formattedCampaigns.length !== currentCampaigns.length) {
          hasChanges = true;
        }

        if (hasChanges) {
          console.log('Campaigns Updated (changes detected)...');
          return updatedCampaigns;
        } else {
          console.log('Campaigns checked - no changes detected');
          return currentCampaigns; // No changes, return existing array
        }
      });
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
      // Only set loading to false if we were actually loading
      if (campaigns.length === 0) {
        setLoading(false);
      }
      console.log('Campaigns refreshed ', campaigns.length);
    }
  }, [program, publicKey, campaigns.length, lastPublicKey]);

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        loading,
        connected,
        publicKey,
        refreshCampaigns,
        deadlineTimestamp,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}
