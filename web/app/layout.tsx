import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '上手くなる気がするぅぅぅ PRO',
  description: '科学的ゴルフ上達アプリ - ジャイロセンサーで傾斜を自動検出し、6次元データでショットを記録・分析',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '気がするぅぅぅ',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: '上手くなる気がするぅぅぅ PRO',
    description: '科学的ゴルフ上達アプリ - ジャイロセンサーで傾斜を自動検出',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '上手くなる気がするぅぅぅ PRO' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '上手くなる気がするぅぅぅ PRO',
    description: '科学的ゴルフ上達アプリ - ジャイロセンサーで傾斜を自動検出',
    images: ['/og-image.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2E7D32',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
