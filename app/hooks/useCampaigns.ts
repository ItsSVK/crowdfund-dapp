import { useContext } from 'react';
import { CampaignContext } from '@/contexts/CampaignContext';

export function useCampaigns() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaigns must be used within a CampaignProvider');
  }
  return context;
}
