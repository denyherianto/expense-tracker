import { db } from '@/db';
import { invoices } from '@/db/schema';
import { desc, gte, eq, and, sql } from 'drizzle-orm';
import { formatIDR } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { PocketBubbles } from '@/components/PocketBubbles';
import { getPockets } from '@/app/actions/pockets';
import { LayoutDashboard, Plus, BarChart3, ArrowRight, Receipt } from 'lucide-react';

async function getDashboardData(pocketId?: string) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const whereClause = pocketId
    ? and(gte(invoices.date, firstDayOfMonth), eq(invoices.pocketId, pocketId))
    : gte(invoices.date, firstDayOfMonth);

  const recentWhere = pocketId ? eq(invoices.pocketId, pocketId) : undefined;

  // Parallel fetching
  const [recentInvoices, totalMonthSpendResult, availablePockets] = await Promise.all([
    db.query.invoices.findMany({
      limit: 5,
      orderBy: [desc(invoices.date), desc(invoices.createdAt)],
      where: recentWhere,
      with: { items: true, pocket: true },
    }),
    db.select({ value: sql<string>`sum(${invoices.totalAmount})` })
      .from(invoices)
      .where(whereClause),
    getPockets(),
  ]);

  return {
    recentInvoices,
    totalMonthSpend: Number(totalMonthSpendResult[0]?.value || 0),
    pockets: availablePockets,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pocketId?: string }>;
}) {
  const params = await searchParams;
  const { recentInvoices, totalMonthSpend, pockets } = await getDashboardData(params.pocketId);
  const currentMonthName = format(new Date(), 'MMMM yyyy');

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen pb-24 font-sans">
      <header className="flex flex-col gap-4 mb-6 pt-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ringkasan</h1>
            <p className="text-sm text-muted-foreground">{format(new Date(), 'MMMM yyyy', { locale: require('date-fns/locale').id })}</p>
          </div>
          {/* <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                 <span className="font-semibold text-xs text-muted-foreground">DH</span>
            </div> */}
        </div>
        <PocketBubbles pockets={pockets} totalSpend={totalMonthSpend} />
      </header>

      {/* Summary Card - Standard Shadcn */}
      <Card className="mb-8 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Total Pengeluaran Bulan Ini</CardDescription>
          <CardTitle className="text-4xl font-bold tracking-tight">{formatIDR(Number(totalMonthSpend))}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            Diperbarui {format(new Date(), 'HH:mm')}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Aktivitas Terkini</h2>
        <Link href="/invoices" className="text-sm text-primary flex items-center hover:underline hover:underline-offset-4 transition-all">
          Lihat Semua <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {recentInvoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/30">
            <Receipt className="mx-auto h-8 w-8 mb-3 opacity-50" />
            <p>Belum ada transaksi {params.pocketId ? 'di pocket ini' : 'bulan ini'}.</p>
            <div className="mt-4">
              <Link href="/add">
                <Button variant="outline" size="sm">Tambah Transaksi</Button>
              </Link>
            </div>
          </div>
        ) : (
          recentInvoices.map((invoice) => (
            <Link href={`/invoices/${invoice.id}`} key={invoice.id}>
              <Card className="hover:bg-muted/50 transition-colors border-border/60 shadow-none mb-2">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border shrink-0">
                      <Receipt className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium text-sm truncate pr-4">{invoice.summary}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span>{format(new Date(invoice.date), 'dd MMM')}</span>
                        <span className="text-[10px] text-muted-foreground/50">•</span>
                        <span className="capitalize">{invoice.pocket?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-sm whitespace-nowrap">
                    {formatIDR(Number(invoice.totalAmount))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Bottom Nav - Glassmorphism & Lucide Icons */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-md pb-safe pt-2 px-6 flex justify-between items-end h-[85px] max-w-md mx-auto z-50">
        <Link href="/" className="flex flex-col items-center gap-1 text-primary w-16 mb-6">
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-[10px] font-medium">Beranda</span>
        </Link>
        <Link href="/add" className="mb-8">
          <div className="bg-primary text-primary-foreground rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95">
            <Plus className="h-7 w-7" />
          </div>
        </Link>
        <Link href="/analysis" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors w-16 mb-6">
          <BarChart3 className="h-6 w-6" />
          <span className="text-[10px] font-medium">Analisis</span>
        </Link>
      </div>
    </div>
  );
}
