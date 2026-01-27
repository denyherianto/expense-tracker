import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Coins } from 'lucide-react';
import { CurrencySelector } from '@/components/CurrencySelector';

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return null;

  return (
    <div className="max-w-md mx-auto px-6 min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50 -mx-6 px-6 py-4 flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-medium tracking-tight text-zinc-900">Settings</h1>
      </header>

      <section className="py-8">
        <Card className="border-zinc-200/60 shadow-subtle rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/50 flex items-center justify-center text-zinc-500">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-zinc-900">Currency</CardTitle>
                <CardDescription className="text-zinc-500 text-sm">Choose your preferred currency for displaying amounts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CurrencySelector />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
