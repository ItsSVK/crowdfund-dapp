'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';

function shortenAddress(address: string) {
  return address.slice(0, 4) + '...' + address.slice(-4);
}

interface CustomWalletButtonProps {
  className?: string;
}

export function CustomWalletButton({ className }: CustomWalletButtonProps) {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (publicKey) {
    return (
      <Button
        className={cn(
          'bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white cursor-pointer flex items-center gap-2',
          className
        )}
        onClick={disconnect}
        disabled={connecting}
      >
        {shortenAddress(publicKey.toBase58())}{' '}
        <span className="opacity-60">|</span> Disconnect
      </Button>
    );
  }

  return (
    <Button
      className={cn(
        'bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white cursor-pointer',
        className
      )}
      onClick={() => setVisible(true)}
      disabled={connecting}
    >
      Connect Wallet
    </Button>
  );
}
