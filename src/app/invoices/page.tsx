import { db } from '@/db';
import { invoices } from '@/db/schema';
import { desc, ilike, or, and, eq } from 'drizzle-orm';
import { formatIDR } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPockets } from '@/app/actions/pockets';
import { PocketBubbles } from '@/components/PocketBubbles';

export default async function InvoicesPage({
  searchParams,
}: {
    searchParams: Promise<{ q?: string; pocketId?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const pocketId = params.pocketId;
  
  const [allInvoices, pockets] = await Promise.all([
    db.query.invoices.findMany({
      where: and(
        query ? or(ilike(invoices.summary, `%${query}%`)) : undefined,
        pocketId ? eq(invoices.pocketId, pocketId) : undefined
      ),
      with: { items: true, pocket: true },
      orderBy: [desc(invoices.date), desc(invoices.createdAt)],
    }),
    getPockets(),
  ]);

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen font-sans">
      <div className="flex items-center gap-4 mb-6 pt-2">
        <Link href="/">
          <Button variant="ghost" size="icon" className="-ml-3"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Belanja</h1>
      </div>

      <div className="mb-6">
        <PocketBubbles pockets={pockets} totalSpend={0} />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <form action="">
          {/* Preserve pocketId if present when searching */}
          {pocketId && <input type="hidden" name="pocketId" value={pocketId} />}
            <Input 
                name="q" 
            placeholder="Cari merchant atau item..." 
                className="pl-9" 
                defaultValue={query}
            />
        </form>
      </div>

      <div className="space-y-3">
        {allInvoices.length === 0 ? (
            <p className="text-center text-muted-foreground mt-10">Tidak ada invoice ditemukan.</p>
        ) : (
            allInvoices.map((invoice) => (
                <Link href={`/invoices/${invoice.id}`} key={invoice.id}>
                <Card className="hover:bg-accent/50 transition-colors mb-2">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <div className="font-medium text-base">{invoice.summary}</div>
                                <div className="text-xs text-muted-foreground">
                                    {format(new Date(invoice.date), 'dd MMM yyyy', { locale: id })}
                                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px]">
                                        {invoice.pocket?.name}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold text-sm">
                                    {formatIDR(Number(invoice.totalAmount))}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                        {invoice.items.length} item
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))
        )}
      </div>
    </div>
  );
}
