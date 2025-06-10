import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';
import Provider from '@/provider';
import Navbar from '@/components/pages/navbar';
import { CampaignProvider } from '@/contexts/CampaignContext';
import PWAInstaller from '@/components/pwa-installer';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CrowdFund Solana - Decentralized Crowdfunding',
  description:
    'Fund innovative projects with the power of Solana blockchain. Create campaigns, donate SOL, and support the next generation of ideas.',
  generator: 'Next.js',
  metadataBase: new URL('https://crowdfund.itssvk.dev'),
  keywords: [
    'crowdfunding',
    'solana',
    'blockchain',
    'cryptocurrency',
    'fundraising',
    'web3',
  ],
  authors: [{ name: 'Shouvik Mohanta' }],
  creator: 'Shouvik Mohanta',
  publisher: 'Shouvik Mohanta',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://crowdfund.itssvk.dev',
    title: 'CrowdFund Solana - Decentralized Crowdfunding',
    description:
      'Fund innovative projects with the power of Solana blockchain. Create campaigns, donate SOL, and support the next generation of ideas.',
    siteName: 'CrowdFund Solana',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'CrowdFund Solana Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrowdFund Solana - Decentralized Crowdfunding',
    description: 'Fund innovative projects with the power of Solana blockchain',
    images: ['/logo.svg'],
    creator: '@ShouvikMohanta',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification tokens here when you have them
    google: 'googlef9998bf8f02c438b.html',
    // yandex: 'your-yandex-verification-token',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Provider>
          <CampaignProvider>
            <div className="min-h-screen bg-background">
              <Navbar />
              {children}
              <PWAInstaller />
              <Analytics />
            </div>
          </CampaignProvider>
        </Provider>
      </body>
    </html>
  );
}
