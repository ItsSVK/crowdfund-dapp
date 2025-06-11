'use client';

import { useEffect, useState, useCallback } from 'react';
import { CreateCampaignDialog } from '@/components/create-campaign-dialog';
import { ContributeModal } from '@/components/contribute-modal';
import {
  HeroSection,
  StatsOverview,
  FilterSection,
  CampaignsList,
} from '@/components/dashboard';
import { useWallet } from '@solana/wallet-adapter-react';
import { Campaign } from '@/types/campaign';
import { ClaimModal } from '@/components/claim-modal';
import { useCampaigns } from '@/hooks/useCampaigns';
import { ActiveFilter, UserFilter } from '@/types/campaign';

export default function Dashboard() {
  const { campaigns, refreshCampaigns } = useCampaigns();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(
    ActiveFilter.All
  );
  const [userFilter, setUserFilter] = useState<UserFilter | null>(null);
  const { connected, publicKey } = useWallet();

  // Memoized callback functions to prevent unnecessary re-renders
  const getCampaignStatus = useCallback((campaign: Campaign) => {
    return campaign.account.campaignStatus();
  }, []);

  // Handle opening contribute modal
  const handleContributeClick = useCallback((campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setContributeModalOpen(true);
  }, []);

  // Handle opening claim modal
  const handleClaimClick = useCallback((campaign: Campaign) => {
    // console.log('Claiming campaign from page', campaign);
    setSelectedCampaign(campaign);
    setClaimModalOpen(true);
  }, []);

  const handleCreateCampaign = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleActiveFilterChange = useCallback(
    (filter: ActiveFilter) => {
      if (filter === ActiveFilter.All) {
        setUserFilter(null);
      }
      if (filter === activeFilter) {
        setActiveFilter(ActiveFilter.All);
      } else {
        setActiveFilter(filter);
      }
    },
    [activeFilter]
  );

  const handleUserFilterChange = useCallback(
    (filter: UserFilter) => {
      if (filter === userFilter) {
        setUserFilter(null);
      } else {
        setUserFilter(filter);
      }
    },
    [userFilter]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      refreshCampaigns();
    }, 15 * 1000);

    return () => clearInterval(interval);
  }, [refreshCampaigns]);

  return (
    <>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <HeroSection
          connected={connected}
          onCreateCampaign={handleCreateCampaign}
        />

        {/* Stats Overview */}
        <StatsOverview
          campaigns={campaigns}
          getCampaignStatus={getCampaignStatus}
        />

        {/* Filter Section */}
        <FilterSection
          campaigns={campaigns}
          connected={connected}
          publicKey={publicKey}
          activeFilter={activeFilter}
          userFilter={userFilter}
          onStatusFilterChange={handleActiveFilterChange}
          onUserFilterChange={handleUserFilterChange}
          getCampaignStatus={getCampaignStatus}
        />

        {/* Campaigns List */}
        <CampaignsList
          activeFilter={activeFilter}
          userFilter={userFilter}
          onContribute={handleContributeClick}
          onClaim={handleClaimClick}
          onCreateCampaign={handleCreateCampaign}
          getCampaignStatus={getCampaignStatus}
        />
      </main>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Contribute Modal */}
      <ContributeModal
        open={contributeModalOpen}
        onOpenChange={setContributeModalOpen}
        campaign={selectedCampaign}
      />

      {/* Claim Modal */}
      <ClaimModal
        open={claimModalOpen}
        onOpenChange={setClaimModalOpen}
        campaign={selectedCampaign}
      />
    </>
  );
}
