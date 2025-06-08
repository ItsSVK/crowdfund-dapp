import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';
import Provider from '@/provider';
import Navbar from '@/components/pages/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CrowdSOL - Decentralized Crowdfunding',
  description: 'Fund innovative projects with the power of Solana blockchain',
  generator: 'v0.dev',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Provider>
          <div className="min-h-screen bg-background">
            <Navbar />
            {children}
          </div>
        </Provider>
      </body>
    </html>
  );
}
