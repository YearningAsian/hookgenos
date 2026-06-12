import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'HookGenOS — Viral Hook Generator',
  description: 'Generate scroll-stopping hooks for TikTok, Instagram, YouTube, LinkedIn and more. Open source, self-hostable.',
  openGraph: {
    title: 'HookGenOS — Viral Hook Generator',
    description: 'Generate scroll-stopping hooks for TikTok, Instagram, YouTube, LinkedIn and more.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} min-h-screen bg-[#09090b] antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
