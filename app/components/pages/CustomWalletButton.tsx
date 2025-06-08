'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

function shortenAddress(address: string) {
  return address.slice(0, 4) + '...' + address.slice(-4);
}

export function CustomWalletButton() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (publicKey) {
    return (
      <Button
        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white cursor-pointer flex items-center gap-2"
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
      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white cursor-pointer"
      onClick={() => setVisible(true)}
      disabled={connecting}
    >
      Connect Wallet
    </Button>
  );
}
