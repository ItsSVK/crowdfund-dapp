'use client';
import { useState, useEffect } from 'react';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';

export function useAnchorProgram() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [program, setProgram] = useState<Program | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);

  useEffect(() => {
    const loadProgram = async () => {
      if (!wallet?.publicKey) return;

      const res = await fetch('/idl/crowdfund.json');
      const idl = (await res.json()) as Idl;

      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      });

      const prog = new Program(idl, provider);
      setProgram(prog);
      setProvider(provider);
    };

    loadProgram();
  }, [wallet, connection]);

  return { program, provider };
}
