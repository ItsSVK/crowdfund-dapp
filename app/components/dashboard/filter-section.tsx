'use client';

import { motion } from 'framer-motion';
import { Target, Clock, XCircle } from 'lucide-react';
import * as anchor from '@coral-xyz/anchor';
import { Campaign, CampaignStatus } from '@/types/campaign';
import { ActiveFilter, UserFilter } from '@/types/campaign';

interface FilterSectionProps {
  campaigns: Campaign[];
  connected: boolean;
  publicKey: anchor.web3.PublicKey | null;
  activeFilter: ActiveFilter;
  userFilter: UserFilter | null;
  onStatusFilterChange: (filter: ActiveFilter) => void;
  onUserFilterChange: (filter: UserFilter) => void;
  getCampaignStatus: (campaign: Campaign) => CampaignStatus;
}

export function FilterSection({
  campaigns,
  connected,
  publicKey,
  activeFilter,
  userFilter,
  onStatusFilterChange,
  onUserFilterChange,
  getCampaignStatus,
}: FilterSectionProps) {
  // Status filter options with counts and colors
  const statusFilterOptions = [
    {
      label: ActiveFilter.All,
      count: campaigns.length,
      color: 'from-purple-500 to-blue-600',
      textColor: 'text-white',
      icon: Target,
    },
    {
      label: ActiveFilter.Active,
      count: campaigns.filter(
        c => getCampaignStatus(c).status === ActiveFilter.Active
      ).length,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-white',
      icon: Clock,
    },
    {
      label: ActiveFilter.Past,
      count: campaigns.filter(
        c => getCampaignStatus(c).status === ActiveFilter.Past
      ).length,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-white',
      icon: Clock,
    },
    {
      label: ActiveFilter.Cancelled,
      count: campaigns.filter(
        c => getCampaignStatus(c).status === ActiveFilter.Cancelled
      ).length,
      color: 'from-red-500 to-pink-500',
      textColor: 'text-white',
      icon: XCircle,
    },
  ];

  // User filter options
  const userFilterOptions = [
    // {
    //   label: 'All Campaigns',
    //   count: campaigns.filter(c => {
    //     const status = getCampaignStatus(c);
    //     return (
    //       status.amITheOwner ||
    //       status.isContributed ||
    //       (status.isContributed && !status.isGoalReached) ||
    //       (status.amITheOwner && status.isGoalReached)
    //     );
    //   }).length,
    //   color: 'from-slate-500 to-gray-600',
    // },
    {
      label: UserFilter.MyCampaigns,
      count: publicKey
        ? campaigns.filter(c => {
            const status = getCampaignStatus(c);
            return status.amITheOwner;
          }).length
        : 0,
      color: 'from-indigo-500 to-purple-600',
    },
    {
      label: UserFilter.Contributed,
      count: publicKey
        ? campaigns.filter(c => {
            const status = getCampaignStatus(c);
            return status.isContributed;
          }).length
        : 0,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: UserFilter.Claimable,
      count: publicKey
        ? campaigns.filter(c => {
            const status = getCampaignStatus(c);
            return (
              (status.isContributed && !status.isGoalReached) ||
              (status.amITheOwner && status.isGoalReached)
            );
          }).length
        : 0,
      color: 'from-emerald-500 to-green-600',
    },
  ];

  if (!connected || campaigns.length === 0) {
    return null;
  }

  return (
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
            <h3 className="text-lg font-semibold mb-1">Campaign Status</h3>
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
                  onClick={() =>
                    onStatusFilterChange(option.label as ActiveFilter)
                  }
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
                  onClick={() => onUserFilterChange(option.label as UserFilter)}
                  disabled={!publicKey}
                  className={`
                    relative overflow-hidden rounded-full px-4 py-2 transition-all duration-300 border text-sm font-medium
                    ${
                      userFilter === option.label
                        ? `bg-gradient-to-r ${option.color} text-white shadow-lg border-transparent`
                        : !publicKey
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
  );
}
