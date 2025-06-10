'use client';

import { type FC, type ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
}) => {
  const endpoint = useMemo(() => {
    // Check if we're running locally with a local validator
    if (
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost'
    ) {
      // Try localhost first for local development
      return process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'http://127.0.0.1:8899';
    }

    // For mobile browsers and production, use Devnet RPC
    return (
      process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
      clusterApiUrl(WalletAdapterNetwork.Devnet)
    );
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
