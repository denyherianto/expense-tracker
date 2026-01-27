import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatIDR } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';
import { DeleteInvoiceButton } from '@/components/DeleteInvoiceButton';

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
    <div className="max-w-md mx-auto px-6 min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50 -mx-6 px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 -ml-2">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
          </Button>
        </Link>
        <h1 className="text-lg font-medium tracking-tight text-zinc-900 truncate">{invoice.summary}</h1>
      </header>

      <section className="py-6">
        <Card className="mb-6 border-zinc-200/60 shadow-subtle rounded-2xl">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl font-medium tracking-tight text-zinc-900">{formatIDR(Number(invoice.totalAmount))}</CardTitle>
              <Badge variant="outline" className="border-zinc-200 text-zinc-600 rounded-full">{invoice.pocket?.name}</Badge>
            </div>
            <CardDescription className="text-zinc-500">{format(new Date(invoice.date), 'EEEE, MMMM dd, yyyy, HH:mm')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <h3 className="text-sm font-medium text-zinc-900 mb-3">Item Details</h3>
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="border-zinc-100">
                    <TableHead className="w-[70%] text-zinc-500 font-normal">Name</TableHead>
                    <TableHead className="text-right w-[30%] text-zinc-500 font-normal">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id} className="border-zinc-100">
                      <TableCell className="align-top">
                        <div className="font-medium text-zinc-900 truncate pr-2" title={item.name}>{item.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {Number(item.quantity)} x {formatIDR(Number(item.unitPrice))} &bull; <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 border-zinc-200 text-zinc-500 rounded-full">{item.category}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-top text-zinc-900 font-medium">
                        {formatIDR(Number(item.totalPrice))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {invoice.rawText && (
              <div className="mt-6 pt-4 border-t border-zinc-100">
                <h3 className="text-xs font-medium mb-1 text-zinc-500">Notes / Raw Text</h3>
                <p className="text-xs text-zinc-400 italic whitespace-pre-wrap">{invoice.rawText}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <DeleteInvoiceButton id={invoice.id} />
        </div>
      </section>
    </div>
  );
}
