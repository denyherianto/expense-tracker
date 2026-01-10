import { db } from '@/db';
import { invoices } from '@/db/schema';
import { AnalysisCharts } from '@/components/AnalysisCharts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PocketBubbles } from '@/components/PocketBubbles';
import { getPockets } from '@/app/actions/pockets';
import { ArrowLeft } from 'lucide-react';

import { sql, gte, lte, and, eq } from 'drizzle-orm';

async function getAnalysisData(pocketId?: string) {
    const now = new Date();
  // Default to current month for daily analysis
  const startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const whereClause = pocketId
      ? and(gte(invoices.date, startOfPeriod), lte(invoices.date, endOfPeriod), eq(invoices.pocketId, pocketId))
      : and(gte(invoices.date, startOfPeriod), lte(invoices.date, endOfPeriod));

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

  // Category Breakdown (also filtered by this month)
    const categoryDataResult = await db.execute(sql`
        SELECT i.category, SUM(i.total_price) as amount
        FROM items i
        JOIN invoices inv ON i.invoice_id = inv.id
        WHERE inv.date >= ${startOfPeriod} AND inv.date <= ${endOfPeriod}
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
        ${pocketId ? sql`AND inv.pocket_id = ${pocketId}` : sql``}
        GROUP BY i.name
        ORDER BY amount DESC
        LIMIT 10
    `);

    // Fetch pockets for the switcher
    const pocketsData = await getPockets();

    // Map to ChartData format
  const periodData = dailyData.map(d => ({ name: d.day, total: Number(d.amount) }));
    const categoryData = categoryDataResult.rows.map((r: any) => ({ name: r.category, value: Number(r.amount) }));
  const itemData = itemDataResult.rows.map((r: any) => ({ name: r.name, value: Number(r.amount) }));

  return { periodData, categoryData, itemData, pockets: pocketsData };
}

export default async function AnalysisPage({
    searchParams,
}: {
    searchParams: Promise<{ pocketId?: string }>;
}) {
    const params = await searchParams;
  const { periodData, categoryData, itemData, pockets } = await getAnalysisData(params.pocketId);

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen font-sans">
      <div className="flex items-center gap-4 mb-6 pt-2">
        <Link href="/">
          <Button variant="ghost" size="icon" className="-ml-3"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Analisis</h1>
      </div>
      
      <div className="mb-6">
        <PocketBubbles pockets={pockets} totalSpend={0} />
      </div>

      <AnalysisCharts data={{ periodData, categoryData, itemData }} />
    </div>
  );
}
