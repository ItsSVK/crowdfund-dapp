'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Wallet } from 'lucide-react';
import { CustomWalletButton } from '@/components/pages/CustomWalletButton';

interface HeroSectionProps {
  connected: boolean;
  onCreateCampaign: () => void;
}

export function HeroSection({ connected, onCreateCampaign }: HeroSectionProps) {
  return (
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
        {connected
          ? 'Fund innovative projects and create campaigns with the power of Solana blockchain'
          : 'Explore transparent crowdfunding campaigns powered by Solana blockchain'}
      </p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        {connected ? (
          <Button
            onClick={onCreateCampaign}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Campaign
          </Button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Wallet className="h-4 w-4" />
              Connect your wallet to create campaigns and contribute to projects
            </p>
            <CustomWalletButton />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
