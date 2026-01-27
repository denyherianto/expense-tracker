import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { getUserSettings } from '@/app/actions/settings';
import { CurrencyCode } from '@/lib/currency';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Finance Tracker',
  description: 'AI-powered Personal Shopping Invoice Tracker',
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getUserSettings();

  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body className={inter.className}>
        <CurrencyProvider initialCurrency={settings.currency as CurrencyCode}>
          {children}
        </CurrencyProvider>
        <Toaster />
      </body>
    </html>
  );
}
