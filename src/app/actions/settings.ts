'use server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { CurrencyCode, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/lib/currency';

export async function getUserSettings() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return { currency: DEFAULT_CURRENCY };
  }

  const [userData] = await db
    .select({ currency: user.currency })
    .from(user)
    .where(eq(user.id, session.user.id));

  return {
    currency: (userData?.currency as CurrencyCode) || DEFAULT_CURRENCY,
  };
}

export async function updateCurrency(currency: CurrencyCode) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate currency code
  if (!SUPPORTED_CURRENCIES.some(c => c.code === currency)) {
    return { success: false, error: 'Invalid currency code' };
  }

  await db
    .update(user)
    .set({ currency })
    .where(eq(user.id, session.user.id));

  return { success: true };
}
