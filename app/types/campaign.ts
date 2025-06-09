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
  isCancelled: boolean;
}

export interface Campaign {
  publicKey: anchor.web3.PublicKey;
  account: CampaignAccount & { campaignStatus: () => CampaignStatus };
}

export interface ContributorRecord {
  publicKey: anchor.web3.PublicKey;
  account: {
    campaign: anchor.web3.PublicKey;
    contributor: anchor.web3.PublicKey;
    amountDonated: anchor.BN;
  };
}

export interface CampaignStatus {
  status: string;
  color: string;
  btnText: string;
  disabled: boolean;
  isContributed: boolean;
  isGoalReached: boolean;
  amITheOwner: boolean;
}
