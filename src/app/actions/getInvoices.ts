'use server';

import { db } from '@/db';
import { invoices } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { desc, ilike, or, and, eq, inArray, gte, lte } from 'drizzle-orm';
import { getPockets } from './pockets';
import { startOfMonth, endOfMonth, parse } from 'date-fns';

const ITEMS_PER_PAGE = 20;

export async function getInvoices({
  page = 1,
  query = '',
  pocketId,
  month,
}: {
  page?: number;
  query?: string;
  pocketId?: string;
  month?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) return { data: [], hasMore: false };

  const userId = session.user.id;

  // Calculate date range
  let startDate: Date, endDate: Date;
  const now = new Date();

  if (month) {
    const parsedDate = parse(month, 'yyyy-MM', new Date());
    startDate = startOfMonth(parsedDate);
    endDate = endOfMonth(parsedDate);
  } else {
    // Default to current month
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  }

  // Fetch accessible pockets first
  const pockets = await getPockets();
  const accessiblePocketIds = pockets.map(p => p.id);

  const visibilityFilter = accessiblePocketIds.length > 0
    ? or(eq(invoices.userId, userId), inArray(invoices.pocketId, accessiblePocketIds))
    : eq(invoices.userId, userId);

  const offset = (page - 1) * ITEMS_PER_PAGE;

  const data = await db.query.invoices.findMany({
    where: and(
      query ? or(ilike(invoices.summary, `%${query}%`)) : undefined,
      pocketId ? eq(invoices.pocketId, pocketId) : undefined,
      and(gte(invoices.date, startDate), lte(invoices.date, endDate)),
      visibilityFilter
    ),
    with: { items: true, pocket: true },
    orderBy: [desc(invoices.date), desc(invoices.createdAt)],
    limit: ITEMS_PER_PAGE,
    offset: offset,
  });

  const hasMore = data.length === ITEMS_PER_PAGE;

  return {
    data,
    hasMore,
    nextPage: hasMore ? page + 1 : null,
  };
}
