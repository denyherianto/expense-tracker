'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
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
    return (
      <div className="text-center py-12 text-zinc-500 text-sm border border-dashed border-zinc-200 rounded-2xl bg-zinc-100/50">
        <span className="material-symbols-outlined mb-3 text-zinc-400" style={{ fontSize: '32px' }}>search_off</span>
        <p>No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-8">
      {invoices.map((invoice, index) => {
        const isLastObj = invoices.length === index + 1;
        return (
          <div key={`${invoice.id}-${index}`} ref={isLastObj ? lastElementRef : null}>
            <Link href={`/invoices/${invoice.id}`}>
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
                  <span className="block text-sm font-medium text-zinc-900 tabular-nums">{formatIDR(Number(invoice.totalAmount))}</span>
                  <span className="text-[10px] text-zinc-400 font-light">{invoice.items.length} item</span>
                </div>
              </div>
            </Link>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      )}
    </div>
  );
}
