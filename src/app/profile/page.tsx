import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { invoices, items } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { formatIDR } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoutButton } from '@/components/LogoutButton';
import Link from 'next/link';
import { ArrowLeft, Calendar, CreditCard, Receipt } from 'lucide-react';
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

    return {
        totalSpend: Number(totalSpendResult?.value || 0),
        invoiceCount: Number(totalInvoices[0]?.count || 0),
        topCategory: topCategoryResult.rows[0] ? (topCategoryResult.rows[0] as { category: string }).category : 'Belum ada',
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
        <div className="container max-w-md mx-auto p-4 min-h-screen font-sans">
             <div className="flex items-center gap-4 mb-6 pt-2">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="-ml-3"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <h1 className="text-xl font-bold tracking-tight">Profil Saya</h1>
            </div>

            <div className="flex flex-col items-center mb-8">
                <Avatar className="h-24 w-24 mb-4 border-2 border-primary/10">
                    <AvatarImage src={user.image || ''} alt={user.name} />
                    <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    <Calendar className="h-3 w-3" />
                    Bergabung {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: id })}
                </div>
            </div>

            <div className="grid gap-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatIDR(stats.totalSpend)}</div>
                        <p className="text-xs text-muted-foreground">Seumur hidup</p>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
                             <Receipt className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.invoiceCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">Top Kategori</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold truncate" title={stats.topCategory}>{stats.topCategory}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <LogoutButton />
        </div>
    );
}
