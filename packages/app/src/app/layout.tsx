import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-jetbrains-mono' });

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
      <body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-[#09090b] antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
