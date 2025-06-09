'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Wallet } from 'lucide-react';
import * as anchor from '@coral-xyz/anchor';
import { Campaign, CampaignStatus } from '@/types/campaign';

interface CampaignCardProps {
  campaign: Campaign;
  index: number;
  onContribute: (campaign: Campaign) => void;
  onClaim: (campaign: Campaign) => void;
  getCampaignStatus: (campaign: Campaign) => CampaignStatus;
}

export function CampaignCard({
  campaign,
  index,
  onContribute,
  onClaim,
  getCampaignStatus,
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

  const status = getCampaignStatus(campaign);
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
            <Badge className={`${status.color} text-white text-xs`}>
              {status.status}
            </Badge>
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
                Deadline:{' '}
                <span className="text-purple-500">
                  {formatDate(campaign.account.deadline)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="truncate">
                Owner: {campaign.account.owner.toBase58().slice(0, 8)}
                ...
                {campaign.account.owner.toBase58().slice(-8)}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            className="w-full"
            variant={status.btnText === 'Contribute' ? 'default' : 'outline'}
            disabled={status.disabled}
            onClick={() => {
              if (status.btnText === 'Contribute') {
                onContribute(campaign);
              }
              if (status.btnText === 'Claim' || status.btnText === 'Withdraw') {
                console.log('Claiming campaign', campaign);
                onClaim(campaign);
              }
              // TODO: Add handlers for other button actions like 'Claim', 'Withdraw'
            }}
          >
            {status.btnText}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
