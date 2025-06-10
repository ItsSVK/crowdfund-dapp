'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Wallet, Plus } from 'lucide-react';
import { CustomWalletButton } from '@/components/pages/CustomWalletButton';
import { CampaignCard } from './campaign-card';
import { PaginationControls } from './pagination-controls';
import { Campaign, CampaignStatus } from '@/types/campaign';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useEffect, useState, useMemo, memo } from 'react';
import { ActiveFilter, UserFilter } from '@/types/campaign';

interface CampaignsListProps {
  activeFilter: ActiveFilter;
  userFilter: UserFilter | null;
  onContribute: (campaign: Campaign) => void;
  onClaim: (campaign: Campaign) => void;
  onCreateCampaign: () => void;
  getCampaignStatus: (campaign: Campaign) => CampaignStatus;
}

function CampaignsListComponent({
  activeFilter,
  userFilter,
  onContribute,
  onClaim,
  onCreateCampaign,
  getCampaignStatus,
}: CampaignsListProps) {
  const { campaigns, loading, connected, publicKey, deadlineTimestamp } =
    useCampaigns();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Memoize filtered campaigns to prevent unnecessary recalculations
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      // First apply status filter using the new campaignStatus function
      let passesStatusFilter = true;
      if (activeFilter !== ActiveFilter.All) {
        const status = campaign.account.campaignStatus();
        passesStatusFilter = status.status === activeFilter;
      }

      // Then apply user filter (only if wallet connected and filter selected)
      let passesUserFilter = true;
      if (publicKey && userFilter) {
        const status = campaign.account.campaignStatus();

        switch (userFilter) {
          case UserFilter.MyCampaigns:
            passesUserFilter = status.amITheOwner;
            break;
          case UserFilter.Contributed:
            // Check if user has contributed using the campaignStatus logic
            passesUserFilter = status.isContributed;
            break;
          case UserFilter.Claimable:
            // Campaigns where user can claim (failed campaigns where user contributed)
            passesUserFilter =
              (status.isContributed && !status.isGoalReached) ||
              (status.amITheOwner && status.isGoalReached);
            break;
          default:
            passesUserFilter = true;
        }
      } else if (!publicKey && userFilter) {
        // If wallet not connected but user filter selected, show no campaigns
        // This will clear the view until wallet is connected
        passesUserFilter = false;
      }

      return passesStatusFilter && passesUserFilter;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, activeFilter, userFilter, publicKey, deadlineTimestamp]);

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

    return { totalPages, paginatedCampaigns };
  }, [filteredCampaigns, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of campaigns section
    document.getElementById('campaigns-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, userFilter]);

  return (
    <div className="space-y-6" id="campaigns-section">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Campaigns</h2>
        <Badge variant="secondary" className="px-3 py-1">
          {filteredCampaigns.length > itemsPerPage
            ? `Page ${currentPage} of ${paginationData.totalPages} • ${filteredCampaigns.length} campaigns`
            : `${filteredCampaigns.length} of ${campaigns.length} campaigns`}
        </Badge>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a campaign and start raising funds!
            </p>
            {connected ? (
              <Button
                onClick={onCreateCampaign}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 cursor-pointer text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Campaign
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to create campaigns
                </p>
                <CustomWalletButton />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            layout
          >
            <AnimatePresence mode="popLayout">
              {paginationData.paginatedCampaigns.map(campaign => (
                <CampaignCard
                  key={campaign.publicKey.toBase58()}
                  campaign={campaign}
                  onContribute={onContribute}
                  onClaim={onClaim}
                  getCampaignStatus={getCampaignStatus}
                  deadlineTimestamp={deadlineTimestamp}
                  connected={connected}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={paginationData.totalPages}
            totalItems={filteredCampaigns.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const CampaignsList = memo(CampaignsListComponent);
