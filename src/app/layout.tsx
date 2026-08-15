import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Outfit, Caveat } from 'next/font/google';
import './globals.css';
import { EggToast } from '@/components/ui/EggToast';
import { Navigation } from '@/components/world/Navigation';
import { PwaRegister } from '@/components/world/PwaRegister';
import { DebugPanel } from '@/components/world/DebugPanel';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display-serif',
});

const sans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans-outfit',
});

const hand = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-hand-caveat',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://olw.local'),
  title: 'i❤kripi — our little world',
  description: 'a little place that belongs only to us.',
  applicationName: 'i❤kripi',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'i❤kripi',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'i❤kripi — our little world',
    description: 'a little place that belongs only to us.',
    images: ['/og.png'],
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#3027a0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${hand.variable}`}>
      <body className="grain">
        {children}
        <Navigation />
        <EggToast />
        <PwaRegister />
        <DebugPanel />
      </body>
    </html>
  );
}