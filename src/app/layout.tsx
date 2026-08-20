import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Outfit, Caveat, Unbounded, Space_Grotesk, Michroma, Fraunces } from 'next/font/google';
import './globals.css';
import { EggToast } from '@/components/ui/EggToast';
import { SiteSidebar } from '@/components/world/SiteSidebar';
import { ContentFrame } from '@/components/world/ContentFrame';
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

/* ---- new design-system typefaces (see design tokens in globals.css) ----
 * Stand-ins for the brief's Apestron / Magnode / Nebulica / Monigue, which
 * aren't available as licensable web fonts — swap the `next/font/google`
 * imports below for real font files later; every consumer reads the
 * --font-apestron/-magnode/-nebulica/-monigue CSS vars, so that's a
 * one-place change. */
const apestron = Unbounded({
  subsets: ['latin'],
  weight: ['500', '700', '800', '900'],
  variable: '--font-apestron-src',
});

const magnode = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-magnode-src',
});

const nebulica = Michroma({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-nebulica-src',
});

const monigue = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-monigue-src',
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
  themeColor: '#101018',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${hand.variable} ${apestron.variable} ${magnode.variable} ${nebulica.variable} ${monigue.variable}`}
    >
      <body className="grain">
        <ContentFrame>{children}</ContentFrame>
        <SiteSidebar />
        <EggToast />
        <PwaRegister />
        <DebugPanel />
      </body>
    </html>
  );
}