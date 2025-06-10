'use client';
import { useState, useEffect } from 'react';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import idl from '../idl/crowdfund.json';

export function useAnchorProgram() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [program, setProgram] = useState<Program | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);

  useEffect(() => {
    const loadProgram = async () => {
      try {
        if (wallet?.publicKey) {
          // Full provider with wallet for transactions
          const anchorProvider = new AnchorProvider(connection, wallet, {
            commitment: 'confirmed',
          });
          const prog = new Program(idl as Idl, anchorProvider);
          setProgram(prog);
          setProvider(anchorProvider);
        } else {
          // Read-only provider for fetching data without wallet
          const readOnlyProvider = {
            connection,
            publicKey: null,
            sendTransaction: () => {
              throw new Error('Wallet not connected');
            },
          };
          const prog = new Program(idl as Idl, readOnlyProvider as any);
          setProgram(prog);
          setProvider(null); // No provider for transactions when not connected
        }
      } catch (error) {
        console.error('Failed to load program:', error);
      }
    };

    loadProgram();
  }, [wallet, connection]);

  return { program, provider };
}
