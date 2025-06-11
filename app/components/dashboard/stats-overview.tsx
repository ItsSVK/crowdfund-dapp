'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Target, Wallet, TrendingUp, CheckCircle2 } from 'lucide-react';
import * as anchor from '@coral-xyz/anchor';
import { ActiveFilter, Campaign, CampaignStatus } from '@/types/campaign';

interface StatsOverviewProps {
  campaigns: Campaign[];
  getCampaignStatus: (campaign: Campaign) => CampaignStatus | null;
}

export function StatsOverview({
  campaigns,
  getCampaignStatus,
}: StatsOverviewProps) {
  const formatSOL = (lamports: anchor.BN) => {
    return (lamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.length}</p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Raised</p>
              <p className="text-2xl font-bold">
                {campaigns
                  .reduce(
                    (sum, c) =>
                      sum + parseFloat(formatSOL(c.account.totalAmountDonated)),
                    0
                  )
                  .toFixed(2)}{' '}
                SOL
              </p>
            </div>
            <Wallet className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Campaigns</p>
              <p className="text-2xl font-bold">
                {
                  campaigns.filter(
                    c => getCampaignStatus(c)?.status === ActiveFilter.Active
                  ).length
                }
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {campaigns.length > 0
                  ? Math.round(
                      (campaigns.filter(
                        c =>
                          (getCampaignStatus(c)?.status === ActiveFilter.Past &&
                            getCampaignStatus(c)?.isGoalReached) ??
                          false
                      ).length /
                        campaigns.length) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
