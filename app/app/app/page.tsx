'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateCampaignDialog } from '@/components/create-campaign-dialog';
import { ContributeModal } from '@/components/contribute-modal';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import {
  CalendarDays,
  Target,
  Wallet,
  TrendingUp,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import * as anchor from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { CustomWalletButton } from '@/components/pages/CustomWalletButton';

interface Campaign {
  publicKey: anchor.web3.PublicKey;
  account: {
    name: string;
    description: string;
    owner: anchor.web3.PublicKey;
    goal: anchor.BN;
    deadline: anchor.BN | null;
    totalAmountDonated: anchor.BN;
    withdrawnByOwner: boolean;
    treasury: anchor.web3.PublicKey;
    isCancelled: boolean;
    campaignStatus?: () => {
      status: string;
      color: string;
      btnText: string;
      disabled: boolean;
    };
  };
}

interface ContributorRecord {
  publicKey: anchor.web3.PublicKey;
  account: {
    campaign: anchor.web3.PublicKey;
    contributor: anchor.web3.PublicKey;
    amountDonated: anchor.BN;
  };
}

export default function Dashboard() {
  const { program } = useAnchorProgram();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [userFilter, setUserFilter] = useState<string>('All Campaigns');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { connected, publicKey } = useWallet();

  // Fetch all campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!program) return;

      try {
        setLoading(true);
        // Use any type to bypass TypeScript issues with dynamic account access
        const campaignAccounts = (await (
          program.account as any
        ).campaign.all()) as Campaign[];
        const userContributions = (await (
          program.account as any
        ).contributorRecord.all([
          {
            memcmp: {
              offset: 40,
              bytes: publicKey?.toBase58() || '',
            },
          },
        ])) as ContributorRecord[];
        console.log('userContributions', userContributions);

        const formattedCampaigns = campaignAccounts.map(
          (campaign: Campaign) => ({
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
                  contribution =>
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
                  };
                if (campaign.account.deadline?.toNumber() >= Date.now() / 1000)
                  return {
                    status: 'Active',
                    color: 'bg-blue-500',
                    btnText: 'Contribute',
                    disabled: false,
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
                  };
                return {
                  status: 'Active',
                  color: 'bg-blue-500',
                  btnText: 'Contribute',
                  disabled: false,
                };
              },
            },
          })
        );

        setCampaigns(formattedCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [program]);

  useEffect(() => {
    if (!connected) {
      setCampaigns([]);
    }
  }, [connected]);

  // Helper functions
  const formatSOL = (lamports: anchor.BN) => {
    return (lamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(2);
  };

  const formatDate = (timestamp: anchor.BN | null) => {
    if (!timestamp) return 'No deadline';
    return new Date(timestamp.toNumber() * 1000).toLocaleDateString();
  };

  const getProgress = (raised: anchor.BN, goal: anchor.BN) => {
    return Math.min((raised.toNumber() / goal.toNumber()) * 100, 100);
  };

  // Get campaign status using the new campaignStatus function
  const getCampaignStatus = (campaign: Campaign) => {
    if (campaign.account.campaignStatus) {
      return campaign.account.campaignStatus();
    }
    // Fallback for campaigns without campaignStatus function
    return {
      status: 'Active',
      color: 'bg-blue-500',
      btnText: 'View',
      disabled: false,
    };
  };

  // Handle opening contribute modal
  const handleContributeClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setContributeModalOpen(true);
  };

  // Handle successful contribution
  const handleContributeSuccess = () => {
    // Refresh campaigns data after successful contribution
    if (program && publicKey) {
      const fetchCampaigns = async () => {
        try {
          const campaignAccounts = await (
            program.account as any
          ).campaign.all();
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

          const formattedCampaigns = campaignAccounts.map(
            (campaign: Campaign) => ({
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
                    };
                  if (
                    campaign.account.deadline?.toNumber() >=
                    Date.now() / 1000
                  )
                    return {
                      status: 'Active',
                      color: 'bg-blue-500',
                      btnText: 'Contribute',
                      disabled: false,
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
                    };
                  return {
                    status: 'Active',
                    color: 'bg-blue-500',
                    btnText: 'Contribute',
                    disabled: false,
                  };
                },
              },
            })
          );

          setCampaigns(formattedCampaigns);
        } catch (error) {
          console.error('Error refreshing campaigns:', error);
        }
      };

      fetchCampaigns();
    }
  };

  // Filter campaigns based on active filter and user filter
  const filteredCampaigns = campaigns.filter(campaign => {
    // First apply status filter using the new campaignStatus function
    let passesStatusFilter = true;
    if (activeFilter !== 'All') {
      const status = getCampaignStatus(campaign);
      passesStatusFilter = status.status === activeFilter;
    }

    // Then apply user filter
    let passesUserFilter = true;
    if (userFilter !== 'All Campaigns' && publicKey) {
      const userPublicKey = publicKey.toBase58();
      const status = getCampaignStatus(campaign);

      switch (userFilter) {
        case 'My Campaigns':
          passesUserFilter =
            campaign.account.owner.toBase58() === userPublicKey;
          break;
        case 'My Contributions':
          // Check if user has contributed using the campaignStatus logic
          passesUserFilter =
            status.btnText === 'Claim' || status.btnText === 'Withdraw';
          break;
        case 'Claimable':
          // Campaigns where user can claim (failed campaigns where user contributed)
          passesUserFilter = status.btnText === 'Claim' && !status.disabled;
          break;
        default:
          passesUserFilter = true;
      }
    }

    return passesStatusFilter && passesUserFilter;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, userFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of campaigns section
    document.getElementById('campaigns-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  // Status filter options with counts and colors
  const statusFilterOptions = [
    {
      label: 'All',
      count: campaigns.length,
      color: 'from-purple-500 to-blue-600',
      textColor: 'text-white',
      icon: Target,
    },
    {
      label: 'Active',
      count: campaigns.filter(c => getCampaignStatus(c).status === 'Active')
        .length,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-white',
      icon: Clock,
    },
    {
      label: 'Past',
      count: campaigns.filter(c => getCampaignStatus(c).status === 'Past')
        .length,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-white',
      icon: Clock,
    },
    {
      label: 'Cancelled',
      count: campaigns.filter(c => getCampaignStatus(c).status === 'Cancelled')
        .length,
      color: 'from-red-500 to-pink-500',
      textColor: 'text-white',
      icon: XCircle,
    },
  ];

  // User filter options
  const userFilterOptions = [
    {
      label: 'All Campaigns',
      count: campaigns.length,
      color: 'from-slate-500 to-gray-600',
    },
    {
      label: 'My Campaigns',
      count: publicKey
        ? campaigns.filter(
            c => c.account.owner.toBase58() === publicKey.toBase58()
          ).length
        : 0,
      color: 'from-indigo-500 to-purple-600',
    },
    {
      label: 'My Contributions',
      count: publicKey
        ? campaigns.filter(c => {
            const status = getCampaignStatus(c);
            return status.btnText === 'Claim' || status.btnText === 'Withdraw';
          }).length
        : 0,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Claimable',
      count: publicKey
        ? campaigns.filter(c => {
            const status = getCampaignStatus(c);
            return status.btnText === 'Claim' && !status.disabled;
          }).length
        : 0,
      color: 'from-emerald-500 to-green-600',
    },
  ];

  return (
    <>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Decentralized Crowdfunding
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Fund innovative projects and make a difference with the power of
            Solana blockchain
          </p>

          {connected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Campaign
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Campaigns
                  </p>
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
                          sum +
                          parseFloat(formatSOL(c.account.totalAmountDonated)),
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
                  <p className="text-sm text-muted-foreground">
                    Active Campaigns
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      campaigns.filter(
                        c => getCampaignStatus(c).status === 'Active'
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
                              getCampaignStatus(c).status === 'Past' ||
                              getCampaignStatus(c).status === 'Completed'
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

        {/* Filter Section */}
        {connected && campaigns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Status Filters */}
              <div>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-1">
                    Campaign Status
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Filter by campaign status
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {statusFilterOptions.map(option => {
                    return (
                      <motion.button
                        key={option.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveFilter(option.label)}
                        className={`
                          relative overflow-hidden rounded-full px-4 py-2 transition-all duration-300 border text-sm font-medium
                          ${
                            activeFilter === option.label
                              ? `bg-gradient-to-r ${option.color} text-white shadow-lg border-transparent`
                              : 'bg-card hover:bg-accent border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <span className="relative z-10">
                          {option.label} ({option.count})
                        </span>
                        {activeFilter === option.label && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* User Filters */}
              <div>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-1">My Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    View your campaigns & contributions
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {userFilterOptions.map(option => {
                    return (
                      <motion.button
                        key={option.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setUserFilter(option.label)}
                        disabled={
                          !publicKey && option.label !== 'All Campaigns'
                        }
                        className={`
                          relative overflow-hidden rounded-full px-4 py-2 transition-all duration-300 border text-sm font-medium
                          ${
                            userFilter === option.label
                              ? `bg-gradient-to-r ${option.color} text-white shadow-lg border-transparent`
                              : !publicKey && option.label !== 'All Campaigns'
                              ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50'
                              : 'bg-card hover:bg-accent border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <span className="relative z-10">
                          {option.label} ({option.count})
                        </span>
                        {userFilter === option.label && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Campaigns List */}
        <div className="space-y-6" id="campaigns-section">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Campaigns</h2>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredCampaigns.length > itemsPerPage
                ? `Page ${currentPage} of ${totalPages} • ${filteredCampaigns.length} campaigns`
                : `${filteredCampaigns.length} of ${campaigns.length} campaigns`}
            </Badge>
          </div>

          {!connected ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">🚀</div>

                <h3 className="text-lg font-semibold mb-2 text-muted-foreground flex items-center justify-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Connect your wallet to explore and launch campaigns
                </h3>
                <CustomWalletButton />
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
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
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              layout
            >
              <AnimatePresence mode="popLayout">
                {paginatedCampaigns.map((campaign, index) => {
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
                            <Badge
                              className={`${status.color} text-white text-xs`}
                            >
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
                                {formatSOL(campaign.account.totalAmountDonated)}{' '}
                                SOL raised
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
                              <span>
                                Goal: {formatSOL(campaign.account.goal)} SOL
                              </span>
                            </div>
                          </div>

                          {/* Campaign Info */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarDays className="h-4 w-4" />
                              <span>
                                Deadline:{' '}
                                {formatDate(campaign.account.deadline)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Wallet className="h-4 w-4" />
                              <span className="truncate">
                                Owner:{' '}
                                {campaign.account.owner.toBase58().slice(0, 8)}
                                ...
                                {campaign.account.owner.toBase58().slice(-8)}
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button
                            className="w-full"
                            variant={
                              status.btnText === 'Contribute'
                                ? 'default'
                                : 'outline'
                            }
                            disabled={status.disabled}
                            onClick={() => {
                              if (status.btnText === 'Contribute') {
                                handleContributeClick(campaign);
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
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {connected && filteredCampaigns.length > itemsPerPage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center space-x-2 mt-8"
            >
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center space-x-1"
              >
                <span>←</span>
                <span>Previous</span>
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  page => {
                    // Show first page, last page, current page, and pages around current
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;

                    const showEllipsis =
                      (page === 2 && currentPage > 4) ||
                      (page === totalPages - 1 && currentPage < totalPages - 3);

                    if (!showPage && !showEllipsis) return null;

                    if (showEllipsis) {
                      return (
                        <span
                          key={`ellipsis-${page}`}
                          className="px-2 text-muted-foreground"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[40px] ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                            : ''
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  }
                )}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <span>→</span>
              </Button>
            </motion.div>
          )}
        </div>
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
        onContributeSuccess={handleContributeSuccess}
      />
    </>
  );
}
