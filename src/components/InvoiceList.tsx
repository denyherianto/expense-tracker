'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatIDR, formatDate } from '@/lib/utils';
import { getInvoices } from '@/app/actions/getInvoices';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Define the Invoice type based on the return type of getInvoices or your schema
// Since we don't have the exact type imported easily, we can infer or define a partial one
interface Item {
    id: string;
    invoiceId: string;
    name: string;
    quantity: string;
    unitPrice: string;
    totalPrice: string;
    category: string;
}

interface Invoice {
  id: string;
  summary: string;
  date: Date;
  totalAmount: string; 
  items: Item[];
  pocket: { name: string } | null;
}

interface InvoiceListProps {
  initialInvoices: Invoice[];
  initialHasMore: boolean;
}

export function InvoiceList({ initialInvoices, initialHasMore }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(2); // Start fetching from page 2
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const pocketId = searchParams.get('pocketId') || undefined;
  const month = searchParams.get('month') || undefined;

  // Reset list when filters change
  useEffect(() => {
    setInvoices(initialInvoices);
    setHasMore(initialHasMore);
    setPage(2);
  }, [initialInvoices, initialHasMore]);
  
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      const res = await getInvoices({ page, query: q, pocketId, month });
      
      setInvoices(prev => [...prev, ...res.data]);
      setHasMore(res.hasMore);
      if (res.hasMore) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to load more invoices", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, q, pocketId, month]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMore]);

  if (invoices.length === 0) {
    return <p className="text-center text-muted-foreground mt-10">Tidak ada Transaksi ditemukan.</p>;
  }

  return (
    <div className="space-y-3 pb-8">
      {invoices.map((invoice, index) => {
        const isLastObj = invoices.length === index + 1;
        return (
            <div key={`${invoice.id}-${index}`} ref={isLastObj ? lastElementRef : null}>
              <Link href={`/invoices/${invoice.id}`}>
                <Card className="hover:bg-accent/50 transition-colors mb-2 !py-0 shadow-none rounded-md">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-base">{invoice.summary}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(invoice.date, { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px]">
                          {invoice.pocket?.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        {formatIDR(Number(invoice.totalAmount))}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {invoice.items.length} item
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
        );
      })}
      
      {isLoading && (
        <div className="flex justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
