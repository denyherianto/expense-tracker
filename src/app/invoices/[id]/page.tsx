import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatIDR } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: invoiceId } = await params;
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: { items: true, pocket: true },
  });

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen font-sans">
      <div className="flex items-center gap-4 mb-6 pt-2">
        <Link href="/">
          <Button variant="ghost" size="icon" className="-ml-3"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-xl font-bold truncate">{invoice.summary}</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
            <div className="flex justify-between items-start">
               <CardTitle>{formatIDR(Number(invoice.totalAmount))}</CardTitle>
               <Badge variant="outline">{invoice.pocket?.name}</Badge>
            </div>
            <CardDescription>{format(new Date(invoice.date), 'EEEE, dd MMMM yyyy, HH:mm', { locale: idLocale })}</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="mt-2">
                <h3 className="text-sm font-semibold mb-2">Items</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60%]">Nama</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                        {Number(item.quantity)} x {formatIDR(Number(item.unitPrice))} &bull; <Badge variant="outline" className="text-[9px] h-4 px-1 py-0">{item.category}</Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right align-top">
                                    {formatIDR(Number(item.totalPrice))}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
             {invoice.rawText && (
                 <div className="mt-6 pt-4 border-t">
                    <h3 className="text-xs font-semibold mb-1 text-muted-foreground">Catatan / Raw Text</h3>
                    <p className="text-xs text-muted-foreground italic whitespace-pre-wrap">{invoice.rawText}</p>
                 </div>
             )}
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
         <Button variant="destructive" size="sm" className="w-full" disabled>Delete Invoice (Coming Soon)</Button>
      </div>
    </div>
  );
}
