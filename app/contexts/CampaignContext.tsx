'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { useWallet } from '@solana/wallet-adapter-react';
import { ActiveFilter, Campaign, ContributorRecord } from '@/types/campaign';
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

function getFormattedCampaigns(
  campaignAccounts: Campaign[],
  userContributions: ContributorRecord[],
  publicKey: PublicKey | null
) {
  return campaignAccounts
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
          const contributorRecord = userContributions.find(
            (contribution: ContributorRecord) =>
              contribution.account.campaign.toBase58() ===
              campaign.publicKey.toBase58()
          );

          const isContributed = publicKey ? !!contributorRecord : false;

          const isContributionWithdrawn =
            !!contributorRecord?.account.withdrawn;

          const isGoalReached =
            campaign.account.totalAmountDonated.toNumber() >=
            campaign.account.goal.toNumber();
          const amITheOwner = publicKey
            ? campaign.account.owner.toBase58() === publicKey.toBase58()
            : false;

          const isAdminWithdrawn = campaign.account.withdrawnByOwner;

          // Handle cases based on connection status
          if (!publicKey) return null;

          // Connected - show normal logic
          if (campaign.account.isCancelled)
            return {
              status: ActiveFilter.Cancelled,
              color: 'bg-red-500',
              btnText: isContributed
                ? isContributionWithdrawn
                  ? 'Already Claimed'
                  : 'Claim'
                : 'Canceled',
              disabled: isContributed
                ? isContributionWithdrawn
                  ? true
                  : false
                : true,
              isContributed: !!isContributed,
              isGoalReached,
              amITheOwner,
              isAdminWithdrawn,
              isContributionWithdrawn,
              amountToBeCollected:
                contributorRecord?.account.amountDonated.toNumber() ?? 0,
            };
          if (campaign.account.deadline?.toNumber() >= Date.now() / 1000)
            return {
              status: ActiveFilter.Active,
              color: 'bg-blue-500',
              btnText: 'Contribute',
              disabled: false,
              isContributed: !!isContributed,
              isGoalReached,
              amITheOwner,
              isAdminWithdrawn,
              isContributionWithdrawn,
              amountToBeCollected: 0,
            };
          if (campaign.account.deadline?.toNumber() < Date.now() / 1000)
            return {
              status: ActiveFilter.Past,
              color: 'bg-emerald-500',
              btnText: isGoalReached
                ? amITheOwner
                  ? isAdminWithdrawn
                    ? 'Already Withdrawn'
                    : 'Withdraw'
                  : 'Completed'
                : isContributed
                ? isContributionWithdrawn
                  ? 'Already Claimed'
                  : 'Claim'
                : 'Completed',
              disabled: isGoalReached
                ? amITheOwner
                  ? isAdminWithdrawn
                    ? true
                    : false
                  : true
                : isContributed
                ? isContributionWithdrawn
                  ? true
                  : false
                : true,
              isContributed: !!isContributed,
              isGoalReached,
              amITheOwner,
              isAdminWithdrawn,
              isContributionWithdrawn,
              amountToBeCollected: isGoalReached
                ? campaign.account.totalAmountDonated.toNumber()
                : isContributed
                ? contributorRecord?.account.amountDonated.toNumber()
                : 0,
            };
          return {
            status: ActiveFilter.Active,
            color: 'bg-blue-500',
            btnText: 'Contribute',
            disabled: false,
            isContributed: !!isContributed,
            isGoalReached,
            amITheOwner,
            isAdminWithdrawn,
            isContributionWithdrawn,
            amountToBeCollected: 0,
          };
        },
      },
    }))
    .sort(
      (a: Campaign, b: Campaign) =>
        b.account.createdAt.toNumber() - a.account.createdAt.toNumber()
    );
}

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const { program } = useAnchorProgram();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lastPublicKey, setLastPublicKey] = useState<string | null>(null);
  const [deadlineTimestamp, setDeadlineTimestamp] = useState(Date.now());

  // Initial fetch when program becomes available
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!program) return;
      try {
        // Only set loading to true if we have no campaigns (initial load)
        if (campaigns.length === 0) {
          setLoading(true);
        }

        const campaignAccounts = await (program.account as any).campaign.all();

        // Only fetch user contributions if wallet is connected
        let userContributions: ContributorRecord[] = [];
        if (publicKey) {
          userContributions = await (
            program.account as any
          ).contributorRecord.all([
            {
              memcmp: {
                offset: 40,
                bytes: publicKey.toBase58(),
              },
            },
          ]);
        }

        // Use the same formatting logic as refreshCampaigns
        const formattedCampaigns = getFormattedCampaigns(
          campaignAccounts,
          userContributions,
          publicKey
        );

        // console.log('Campaigns Updated (initial/refresh)...');
        setCampaigns(formattedCampaigns);
        setLastPublicKey(publicKey?.toBase58() || 'no-wallet');
      } catch (error) {
        console.error('Error fetching campaigns:', error);

        // Provide specific error messages for network issues
        if (error instanceof Error) {
          if (
            error.message.includes('Failed to fetch') ||
            error.message.includes('Network request failed')
          ) {
            toast.error(
              'Network connection failed. Please check your internet connection and try again.'
            );
          } else if (error.message.includes('CORS')) {
            toast.error(
              'Connection blocked by CORS policy. Please try refreshing the page.'
            );
          } else {
            toast.error('Failed to load campaigns. Please try again.');
          }
        }
      } finally {
        if (campaigns.length === 0) {
          setLoading(false);
        }
      }
    };

    fetchCampaigns();
  }, [program, publicKey]); // Depend on both program and publicKey for initial fetch

  useEffect(() => {
    if (!connected) {
      // Don't clear campaigns when disconnected - keep them visible
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
          // console.log('Campaign deadline expired - updating button states');
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
    if (!program) return;
    try {
      // Only set loading to true if we have no campaigns (initial load)
      // Don't show loading spinner for background refreshes
      if (campaigns.length === 0) {
        setLoading(true);
      }

      const campaignAccounts = await (program.account as any).campaign.all();

      // Only fetch user contributions if wallet is connected
      let userContributions: ContributorRecord[] = [];
      if (publicKey) {
        userContributions = await (
          program.account as any
        ).contributorRecord.all([
          {
            memcmp: {
              offset: 40,
              bytes: publicKey.toBase58(),
            },
          },
        ]);
      }

      const formattedCampaigns = getFormattedCampaigns(
        campaignAccounts,
        userContributions,
        publicKey
      );

      // Smart update: only update campaigns that have actually changed
      setCampaigns(currentCampaigns => {
        const currentPublicKeyString = publicKey?.toBase58() || 'no-wallet';

        // Check if publicKey has changed - if so, force complete refresh
        // because user's relationship to all campaigns has changed
        if (lastPublicKey && lastPublicKey !== currentPublicKeyString) {
          // console.log('PublicKey changed - forcing complete campaign refresh');
          setLastPublicKey(currentPublicKeyString);
          return formattedCampaigns;
        }

        // Set the current publicKey for future comparisons
        if (!lastPublicKey) {
          setLastPublicKey(currentPublicKeyString);
        }

        // If no campaigns exist, return the new ones
        if (currentCampaigns.length === 0) {
          // console.log('Campaigns Updated (initial load)...');
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
          // console.log('Campaigns Updated (changes detected)...');
          return updatedCampaigns;
        } else {
          // console.log('Campaigns checked - no changes detected');
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
      } else if (error instanceof Error) {
        // Handle network-specific errors
        if (
          error.message.includes('Failed to fetch') ||
          error.message.includes('Network request failed')
        ) {
          toast.error(
            'Network connection failed. Please check your internet connection and try again.'
          );
        } else if (error.message.includes('CORS')) {
          toast.error(
            'Connection blocked by CORS policy. Please try refreshing the page.'
          );
        } else if ('transactionLogs' in error) {
          console.error('Transaction logs:', error.transactionLogs);
          toast.error('Transaction failed. Please try again.');
        } else {
          toast.error('Failed to refresh campaigns. Please try again.');
        }
      }
    } finally {
      // Only set loading to false if we were actually loading
      if (campaigns.length === 0) {
        setLoading(false);
      }
      // console.log('Campaigns refreshed ', campaigns.length);
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
