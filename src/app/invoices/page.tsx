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
    <div className="container max-w-md mx-auto p-4 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon"><span className="material-symbols-outlined">arrow_back</span></Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Belanja</h1>
      </div>

      <div className="mb-6 h-8">
        <PocketBubbles pockets={pockets} totalSpend={0} readonly={true} />
      </div>

      <div className="space-y-2 mb-6">
        <SearchInput placeholder="Cari transaksi atau barang..." />
        <MonthFilter />
      </div>

      <div className="space-y-3">
        <InvoiceList initialInvoices={data} initialHasMore={hasMore} />
      </div>
    </div>
  );
}
