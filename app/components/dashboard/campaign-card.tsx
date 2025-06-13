'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, CheckIcon, Copy, Wallet, X } from 'lucide-react';
import * as anchor from '@coral-xyz/anchor';
import { ActiveFilter, Campaign, CampaignStatus } from '@/types/campaign';
import React, { memo, useMemo } from 'react';
import { CustomWalletButton } from '@/components/pages/CustomWalletButton';
interface CampaignCardProps {
  campaign: Campaign;
  onContribute: (campaign: Campaign) => void;
  onClaim: (campaign: Campaign) => void;
  onCancel: (campaign: Campaign) => void;
  getCampaignStatus: (campaign: Campaign) => CampaignStatus | null;
  deadlineTimestamp: number;
}

function CampaignCardComponent({
  campaign,
  onContribute,
  onClaim,
  onCancel,
  getCampaignStatus,
  deadlineTimestamp,
}: CampaignCardProps) {
  const formatSOL = (lamports: anchor.BN) => {
    return (lamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(2);
  };

  const formatDate = (timestamp: anchor.BN | null) => {
    if (!timestamp) return 'No deadline';
    return new Date(timestamp.toNumber() * 1000).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getProgress = (raised: anchor.BN, goal: anchor.BN) => {
    return Math.min((raised.toNumber() / goal.toNumber()) * 100, 100);
  };

  // Use deadlineTimestamp to ensure re-render when deadlines expire
  // This dependency forces React to re-render and recalculate status when deadlines change
  const status = useMemo(() => {
    // The deadlineTimestamp dependency ensures this recalculates when deadlines expire
    return getCampaignStatus(campaign);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, getCampaignStatus, deadlineTimestamp]);
  const progress = getProgress(
    campaign.account.totalAmountDonated,
    campaign.account.goal
  );

  return (
    <motion.div
      whileHover={{ y: -4 }}
      key={campaign.publicKey.toBase58()}
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 25,
        mass: 1,
      }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-2">
              {campaign.account.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={`${status?.color} text-white text-xs`}>
                {status?.status}
              </Badge>
              {status?.status === ActiveFilter.Active &&
                status?.amITheOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onCancel(campaign)}
                    title="Cancel Campaign"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.account.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
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
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Goal: {formatSOL(campaign.account.goal)} SOL</span>
            </div>
          </div>

          {/* Campaign Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                Created At:{' '}
                <span className="text-blue-600">
                  {formatDate(campaign.account.createdAt)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                Deadline:{' '}
                <span className="text-purple-500">
                  {formatDate(campaign.account.deadline)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="truncate">
                Owner:{' '}
                <span className="font-bold">
                  {campaign.account.owner.toBase58().slice(0, 8)}
                  ...
                  {campaign.account.owner.toBase58().slice(-8)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 ml-2 cursor-pointer bg-transparent border-0"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      campaign.account.owner.toBase58()
                    );
                    document
                      .getElementById(
                        `check-icon-${campaign.publicKey.toBase58()}`
                      )
                      ?.classList.remove('hidden');
                    document
                      .getElementById(
                        `copy-button-${campaign.publicKey.toBase58()}`
                      )
                      ?.classList.add('hidden');
                    setTimeout(() => {
                      document
                        .getElementById(
                          `check-icon-${campaign.publicKey.toBase58()}`
                        )
                        ?.classList.add('hidden');
                      document
                        .getElementById(
                          `copy-button-${campaign.publicKey.toBase58()}`
                        )
                        ?.classList.remove('hidden');
                    }, 1500);
                  }}
                >
                  <Copy
                    id={`copy-button-${campaign.publicKey.toBase58()}`}
                    className="h-1 w-1 bg-transparent border-0 hover:bg-transparent"
                  />
                  <CheckIcon
                    id={`check-icon-${campaign.publicKey.toBase58()}`}
                    className="h-1 w-1 hidden bg-transparent border-0 hover:bg-transparent"
                  />
                </Button>
              </span>
            </div>
          </div>

          {/* Action Button */}
          {status === null ? (
            <CustomWalletButton className="w-full" />
          ) : (
            <Button
              className="w-full cursor-pointer"
              variant={status.btnText === 'Contribute' ? 'default' : 'outline'}
              disabled={status.disabled}
              onClick={() => {
                if (status.btnText === 'Contribute') {
                  onContribute(campaign);
                }
                if (
                  status.btnText === 'Claim' ||
                  status.btnText === 'Withdraw'
                ) {
                  onClaim(campaign);
                }
              }}
            >
              {status.btnText}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const CampaignCard = memo(CampaignCardComponent);
