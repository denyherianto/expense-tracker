import { db } from '@/db';
import { invoices } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AnalysisCharts } from '@/components/AnalysisCharts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PocketBubbles } from '@/components/PocketBubbles';
import { MonthFilter } from '@/components/MonthFilter';
import { getPockets } from '@/app/actions/pockets';
import { ArrowLeft } from 'lucide-react';
import { startOfMonth, endOfMonth, parse } from 'date-fns';

import { sql, gte, lte, and, eq } from 'drizzle-orm';

async function getAnalysisData(pocketId?: string, monthParam?: string) {
  const now = new Date();
  let startOfPeriod: Date, endOfPeriod: Date;

  if (monthParam) {
    const parsedDate = parse(monthParam, 'yyyy-MM', new Date());
    startOfPeriod = startOfMonth(parsedDate);
    endOfPeriod = endOfMonth(parsedDate);
  } else {
    startOfPeriod = startOfMonth(now);
    endOfPeriod = endOfMonth(now);
  }

  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) return { periodData: [], categoryData: [], itemData: [], pockets: [] };
  const userId = session.user.id;

  const whereClause = pocketId
    ? and(gte(invoices.date, startOfPeriod), lte(invoices.date, endOfPeriod), eq(invoices.pocketId, pocketId), eq(invoices.userId, userId))
    : and(gte(invoices.date, startOfPeriod), lte(invoices.date, endOfPeriod), eq(invoices.userId, userId));

  // Daily Spending
  const dailyData = await db.select({
    day: sql<string>`to_char(${invoices.date}, 'DD Mon')`,
    dateRaw: sql<string>`to_char(${invoices.date}, 'YYYY-MM-DD')`,
    amount: sql<number>`sum(${invoices.totalAmount})`
  })
    .from(invoices)
    .where(whereClause)
    .groupBy(sql`to_char(${invoices.date}, 'DD Mon'), to_char(${invoices.date}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${invoices.date}, 'YYYY-MM-DD')`);

  // Category Breakdown
  const categoryDataResult = await db.execute(sql`
        SELECT i.category, SUM(i.total_price) as amount
        FROM items i
        JOIN invoices inv ON i.invoice_id = inv.id
        WHERE inv.date >= ${startOfPeriod} AND inv.date <= ${endOfPeriod}
        AND inv.user_id = ${userId}
        ${pocketId ? sql`AND inv.pocket_id = ${pocketId}` : sql``}
        GROUP BY i.category
        ORDER BY amount DESC
    `);

  // Item Breakdown
  const itemDataResult = await db.execute(sql`
        SELECT i.name, SUM(i.total_price) as amount
        FROM items i
        JOIN invoices inv ON i.invoice_id = inv.id
        WHERE inv.date >= ${startOfPeriod} AND inv.date <= ${endOfPeriod}
        AND inv.user_id = ${userId}
        ${pocketId ? sql`AND inv.pocket_id = ${pocketId}` : sql``}
        GROUP BY i.name
        ORDER BY amount DESC
        LIMIT 10
    `);

  // Fetch pockets for the switcher
  const pocketsData = await getPockets();

  // Map to ChartData format
  const periodData = dailyData.map(d => ({ name: d.day, total: Number(d.amount) }));
  const categoryData = (categoryDataResult.rows as { category: string; amount: number }[]).map(r => ({ name: r.category, value: Number(r.amount) }));
  const itemData = (itemDataResult.rows as { name: string; amount: number }[]).map(r => ({ name: r.name, value: Number(r.amount) }));

  return { periodData, categoryData, itemData, pockets: pocketsData };
}

export default async function AnalysisPage({
  searchParams,
}: {
    searchParams: Promise<{ pocketId?: string; month?: string }>;
}) {
  const params = await searchParams;
  const { periodData, categoryData, itemData, pockets } = await getAnalysisData(params.pocketId, params.month);

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon"><span className="material-symbols-outlined">arrow_back</span></Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Analisis</h1>
      </div>

      <div className="mb-6 h-8">
        <PocketBubbles pockets={pockets} totalSpend={0} readonly={true} />
      </div>

      <div className="mb-6">
        <MonthFilter />
      </div>

      <AnalysisCharts data={{ periodData, categoryData, itemData }} />
    </div>
  );
}
