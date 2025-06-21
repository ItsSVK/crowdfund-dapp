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
  title: {
    template: '%s | CrowdFund Solana',
    default: 'CrowdFund Solana - Decentralized Crowdfunding Platform',
  },
  description:
    'Fund innovative projects with the power of Solana blockchain. Create campaigns, donate SOL, and support the next generation of ideas.',
  generator: 'Next.js',
  metadataBase: new URL('https://crowdfund.itssvk.dev'),
  applicationName: 'CrowdFund Solana',
  keywords: [
    'crowdfunding',
    'solana',
    'blockchain',
    'cryptocurrency',
    'fundraising',
    'web3',
    'decentralized',
    'campaigns',
    'donations',
  ],
  authors: [{ name: 'Shouvik Mohanta', url: 'https://itssvk.dev' }],
  creator: 'Shouvik Mohanta',
  publisher: 'Shouvik Mohanta',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://crowdfund.itssvk.dev',
    siteName: 'CrowdFund Solana',
    title: 'CrowdFund Solana - Decentralized Crowdfunding Platform',
    description:
      'Fund innovative projects with the power of Solana blockchain. Create campaigns, donate SOL, and support the next generation of ideas.',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'CrowdFund Solana - Decentralized Crowdfunding Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ShouvikMohanta',
    creator: '@ShouvikMohanta',
    title: 'CrowdFund Solana - Decentralized Crowdfunding Platform',
    description:
      'Fund innovative projects with the power of Solana blockchain. Create campaigns, donate SOL, and support the next generation of ideas.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CrowdFund Solana - Decentralized Crowdfunding Platform',
      },
    ],
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
    google: 'googlef9998bf8f02c438b.html',
  },
  category: 'technology',
  classification: 'Business & Finance',
  other: {
    'theme-color': '#8B5CF6',
    'color-scheme': 'light dark',
    'msapplication-TileColor': '#8B5CF6',
    'msapplication-config': '/browserconfig.xml',
  },
};

// Add structured data for better SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CrowdFund Solana',
  description:
    'Decentralized crowdfunding platform powered by Solana blockchain',
  url: 'https://crowdfund.itssvk.dev',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Person',
    name: 'Shouvik Mohanta',
    url: 'https://itssvk.dev',
  },
  publisher: {
    '@type': 'Organization',
    name: 'CrowdFund Solana',
    logo: {
      '@type': 'ImageObject',
      url: 'https://crowdfund.itssvk.dev/icon-512x512.png',
    },
  },
  image: {
    '@type': 'ImageObject',
    url: 'https://crowdfund.itssvk.dev/icon-512x512.png',
    width: 512,
    height: 512,
  },
  featureList: [
    'Decentralized crowdfunding',
    'Solana blockchain integration',
    'Smart contract security',
    'Global accessibility',
    'Transparent funding',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="msapplication-TileColor" content="#8B5CF6" />
        <link rel="canonical" href="https://crowdfund.itssvk.dev" />
      </head>
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
