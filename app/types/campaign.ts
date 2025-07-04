import * as anchor from '@coral-xyz/anchor';

interface CampaignAccount {
  name: string;
  description: string;
  owner: anchor.web3.PublicKey;
  goal: anchor.BN;
  deadline: anchor.BN | null;
  totalAmountDonated: anchor.BN;
  withdrawnByOwner: boolean;
  treasury: anchor.web3.PublicKey;
  createdAt: anchor.BN;
  isCancelled: boolean;
}

export interface Campaign {
  publicKey: anchor.web3.PublicKey;
  account: CampaignAccount & { campaignStatus: () => CampaignStatus | null };
}

export interface ContributorRecord {
  publicKey: anchor.web3.PublicKey;
  account: {
    campaign: anchor.web3.PublicKey;
    contributor: anchor.web3.PublicKey;
    amountDonated: anchor.BN;
    withdrawn: boolean;
  };
}

export interface CampaignStatus {
  status: ActiveFilter;
  color: string;
  btnText: string;
  disabled: boolean;
  isContributed: boolean;
  isGoalReached: boolean;
  amITheOwner: boolean;
  isAdminWithdrawn: boolean;
  isContributionWithdrawn: boolean;
  amountToBeCollected: number;
}

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
