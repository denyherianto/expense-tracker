import { db } from '@/db';
import { invoices, user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { desc, gte, eq, and, sql, or, inArray } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';
import { formatCurrency, getCurrencySymbol, CurrencyCode, DEFAULT_CURRENCY } from '@/lib/currency';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { PocketBubbles } from '@/components/PocketBubbles';
import { getPockets } from '@/app/actions/pockets';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

async function getDashboardData(pocketId?: string) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) return { recentInvoices: [], totalMonthSpend: 0, pockets: [], user: null, currency: DEFAULT_CURRENCY };

  const userId = session.user.id;

  // Fetch accessible pockets first to determine visibility
  const availablePockets = await getPockets();
  const accessiblePocketIds = availablePockets.map(p => p.id);

  // Visibility Logic:
  // 1. Own invoices
  // 2. Invoices in pockets I am a member of
  const visibilityFilter = accessiblePocketIds.length > 0
    ? or(eq(invoices.userId, userId), inArray(invoices.pocketId, accessiblePocketIds))
    : eq(invoices.userId, userId);

  const whereClause = pocketId
    ? and(gte(invoices.date, firstDayOfMonth), eq(invoices.pocketId, pocketId), visibilityFilter)
    : and(gte(invoices.date, firstDayOfMonth), visibilityFilter);

  const recentWhere = pocketId
    ? and(eq(invoices.pocketId, pocketId), visibilityFilter)
    : visibilityFilter;

  // Parallel fetching for invoices, stats and user currency
  const [recentInvoices, totalMonthSpendResult, userData] = await Promise.all([
    db.query.invoices.findMany({
      limit: 5,
      orderBy: [desc(invoices.date), desc(invoices.createdAt)],
      where: recentWhere,
      with: { items: true, pocket: true },
    }),
    db.select({ value: sql<string>`sum(${invoices.totalAmount})` })
      .from(invoices)
      .where(whereClause),
    db.select({ currency: user.currency })
      .from(user)
      .where(eq(user.id, userId)),
  ]);

  return {
    recentInvoices,
    totalMonthSpend: Number(totalMonthSpendResult[0]?.value || 0),
    pockets: availablePockets,
    user: session.user,
    currency: (userData[0]?.currency as CurrencyCode) || DEFAULT_CURRENCY,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pocketId?: string }>;
}) {
  const params = await searchParams;
  const { recentInvoices, totalMonthSpend, pockets, user, currency } = await getDashboardData(params.pocketId);

  if (!user) return null; // Should be handled by middleware, but for safety

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="max-w-md mx-auto px-6 min-h-screen pb-32 font-sans bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50 -mx-6 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Avatar className="h-8 w-8 border border-zinc-200 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={user.image || ''} alt={user.name} />
              <AvatarFallback className="bg-zinc-900 text-white text-xs font-medium">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 font-normal">{formatDate(new Date(), { month: 'long', year: 'numeric' })}</span>
            <span className="text-sm font-medium tracking-tight">Overview</span>
          </div>
        </div>
      </header>

      {/* Total Spend */}
      <section className="py-8">
        <h1 className="text-zinc-500 text-sm font-normal mb-1">Total Expenses</h1>
        <div className="flex items-baseline gap-1">
          <span className="text-sm text-zinc-400 font-light -translate-y-1">{currencySymbol}</span>
          <span className="text-4xl font-medium tracking-tight text-zinc-900">
            {new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US').format(Number(totalMonthSpend))}
          </span>
        </div>
      </section>

      {/* Pockets */}
      <section className="mb-8">
        <PocketBubbles pockets={pockets} totalSpend={totalMonthSpend} />
      </section>

      {/* Recent Invoices */}
      <section>
        <h2 className="text-sm font-medium tracking-tight text-zinc-900 mb-4">Recent Transactions</h2>

        <div className="flex flex-col">
          {recentInvoices.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm border border-dashed border-zinc-200 rounded-2xl bg-zinc-100/50">
              <span className="material-symbols-outlined mb-3 text-zinc-400" style={{ fontSize: '32px' }}>receipt_long</span>
              <p>No transactions {params.pocketId ? 'in this Pocket' : 'this month'}.</p>
              <div className="mt-4">
                <Link href="/add">
                  <Button variant="outline" size="sm" className="rounded-xl">Add Transaction</Button>
                </Link>
              </div>
            </div>
          ) : (
              <>
                {recentInvoices.map((invoice) => (
                  <Link href={`/invoices/${invoice.id}`} key={invoice.id}>
                  <div className="group flex items-center justify-between py-4 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/50 flex items-center justify-center text-zinc-500">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>receipt</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-900 truncate max-w-[180px]">{invoice.summary}</span>
                        <span className="text-xs text-zinc-500 font-light flex items-center gap-1">
                          {invoice.pocket?.name} <span className="w-0.5 h-0.5 rounded-full bg-zinc-300"></span> {formatDate(invoice.date, { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-medium text-zinc-900 tabular-nums">{formatCurrency(Number(invoice.totalAmount), currency)}</span>
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/invoices" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors mt-4 flex items-center justify-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-200/80 px-6 py-4 pb-6 flex justify-between items-center z-40 max-w-md mx-auto">
        <Link href="/" className="flex flex-col items-center gap-1 text-zinc-900 w-16">
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>home</span>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <div className="w-14"></div> {/* Spacer for FAB */}
        <Link href="/analysis" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-600 transition-colors w-16">
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>pie_chart</span>
          <span className="text-[10px] font-medium">Analysis</span>
        </Link>

        {/* Center Floating Action Button */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <Link href="/add">
            <button className="w-14 h-14 bg-zinc-900 rounded-full text-white shadow-float flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-4 border-zinc-50">
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>add</span>
            </button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
