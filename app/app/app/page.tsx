'use client';

import { useState } from 'react';
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

export enum ActiveFilter {
  All = 'All',
  Active = 'Active',
  Past = 'Past',
  Cancelled = 'Cancelled',
}

export enum UserFilter {
  MyCampaigns = 'My Campaigns',
  Contributed = 'Contributed',
  Claimable = 'Claimable',
}

export default function Dashboard() {
  const { campaigns } = useCampaigns();
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

  // Handle opening contribute modal
  const handleContributeClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setContributeModalOpen(true);
  };

  // Handle opening claim modal
  const handleClaimClick = (campaign: Campaign) => {
    console.log('Claiming campaign from page', campaign);
    setSelectedCampaign(campaign);
    setClaimModalOpen(true);
  };

  const handleActiveFilterChange = (filter: ActiveFilter) => {
    if (filter === ActiveFilter.All) {
      setUserFilter(null);
    }
    if (filter === activeFilter) {
      setActiveFilter(ActiveFilter.All);
    } else {
      setActiveFilter(filter);
    }
  };

  const handleUserFilterChange = (filter: UserFilter) => {
    if (filter === userFilter) {
      setUserFilter(null);
    } else {
      setUserFilter(filter);
    }
  };

  return (
    <>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <HeroSection
          connected={connected}
          onCreateCampaign={() => setCreateDialogOpen(true)}
        />

        {/* Stats Overview */}
        <StatsOverview
          campaigns={campaigns}
          getCampaignStatus={campaign => campaign.account.campaignStatus()}
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
          getCampaignStatus={campaign => campaign.account.campaignStatus()}
        />

        {/* Campaigns List */}
        <CampaignsList
          activeFilter={activeFilter}
          userFilter={userFilter}
          onContribute={handleContributeClick}
          onClaim={handleClaimClick}
          onCreateCampaign={() => setCreateDialogOpen(true)}
          getCampaignStatus={campaign => campaign.account.campaignStatus()}
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
