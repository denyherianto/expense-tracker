import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { SearchInput } from '@/components/SearchInput';
import { MonthFilter } from '@/components/MonthFilter';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPockets } from '@/app/actions/pockets';
import { PocketBubbles } from '@/components/PocketBubbles';
import { getInvoices } from '@/app/actions/getInvoices';
import { InvoiceList } from '@/components/InvoiceList';
export default async function InvoicesPage({
  searchParams,
}: {
    searchParams: Promise<{ q?: string; pocketId?: string; month?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const pocketId = params.pocketId;
  const monthParam = params.month;

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return null; // Or redirect handled by middleware

  const pockets = await getPockets();

  // Fetch first page of invoices using the server action logic
  const { data, hasMore } = await getInvoices({
    page: 1,
    query,
    pocketId: pocketId,
    month: monthParam,
  });

  return (
    <div className="max-w-md mx-auto px-6 min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50 -mx-6 px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 -ml-2">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
          </Button>
        </Link>
        <h1 className="text-lg font-medium tracking-tight text-zinc-900">Transaction History</h1>
      </header>

      <section className="py-6">
        <div className="mb-6">
          <PocketBubbles pockets={pockets} totalSpend={0} readonly={true} />
        </div>

        <div className="space-y-3 mb-6">
          <SearchInput placeholder="Search transactions or items..." />
          <MonthFilter />
        </div>

        <InvoiceList initialInvoices={data} initialHasMore={hasMore} />
      </section>
    </div>
  );
}
