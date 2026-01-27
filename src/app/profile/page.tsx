import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { invoices, items, user } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { formatCurrency, CurrencyCode, DEFAULT_CURRENCY } from '@/lib/currency';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoutButton } from '@/components/LogoutButton';
import Link from 'next/link';
import { ArrowLeft, Calendar, CreditCard, Receipt, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function getUserStats(userId: string) {
    const [totalSpendResult] = await db.select({ value: sql<string>`sum(${invoices.totalAmount})` })
        .from(invoices)
        .where(eq(invoices.userId, userId));

    const totalInvoices = await db.select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(eq(invoices.userId, userId));

    const topCategoryResult = await db.execute(sql`
        SELECT category, SUM(total_price) as amount
        FROM items i
        JOIN invoices inv ON i.invoice_id = inv.id
        WHERE inv.user_id = ${userId}
        GROUP BY category
        ORDER BY amount DESC
        LIMIT 1
    `);

    const [userData] = await db
        .select({ currency: user.currency })
        .from(user)
        .where(eq(user.id, userId));

    return {
        totalSpend: Number(totalSpendResult?.value || 0),
        invoiceCount: Number(totalInvoices[0]?.count || 0),
        topCategory: topCategoryResult.rows[0] ? (topCategoryResult.rows[0] as { category: string }).category : 'None yet',
        currency: (userData?.currency as CurrencyCode) || DEFAULT_CURRENCY,
    };
}

export default async function ProfilePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) return null;

    const user = session.user;
    const stats = await getUserStats(user.id);

    return (
        <div className="max-w-md mx-auto px-6 min-h-screen bg-zinc-50 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50 -mx-6 px-6 py-4 flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 -ml-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-lg font-medium tracking-tight text-zinc-900">My Profile</h1>
            </header>

            <section className="py-8">
                <div className="flex flex-col items-center mb-8">
                    <Avatar className="h-24 w-24 mb-4 border-2 border-zinc-200">
                        <AvatarImage src={user.image || ''} alt={user.name} />
                        <AvatarFallback className="text-2xl bg-zinc-900 text-white">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-medium tracking-tight text-zinc-900">{user.name}</h2>
                    <p className="text-zinc-500 text-sm">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
                        <Calendar className="h-3 w-3" />
                        Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </div>
                </div>

                <div className="grid gap-3 mb-8">
                    <Card className="border-zinc-200/60 shadow-subtle rounded-2xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-500">Total Expenses</CardTitle>
                            <CreditCard className="h-4 w-4 text-zinc-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-medium tracking-tight text-zinc-900">{formatCurrency(stats.totalSpend, stats.currency)}</div>
                            <p className="text-xs text-zinc-400">Lifetime</p>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-2 gap-3">
                        <Card className="border-zinc-200/60 shadow-subtle rounded-2xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-500">Transactions</CardTitle>
                                <Receipt className="h-4 w-4 text-zinc-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-medium tracking-tight text-zinc-900">{stats.invoiceCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-zinc-200/60 shadow-subtle rounded-2xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-500">Top Category</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-medium tracking-tight text-zinc-900 truncate" title={stats.topCategory}>{stats.topCategory}</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Link href="/settings" className="block mb-4">
                    <Button variant="outline" className="w-full rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </Link>

                <LogoutButton />
            </section>
        </div>
    );
}
