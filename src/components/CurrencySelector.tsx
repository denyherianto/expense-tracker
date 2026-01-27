'use client';

import { useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/lib/currency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCurrencyChange = async (value: string) => {
    setIsUpdating(true);
    try {
      const result = await setCurrency(value as CurrencyCode);
      if (result.success) {
        toast.success('Currency updated');
      } else {
        toast.error(result.error || 'Failed to update currency');
      }
    } catch (error) {
      toast.error('Failed to update currency');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <Select value={currency} onValueChange={handleCurrencyChange} disabled={isUpdating}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              <span className="flex items-center gap-2">
                <span className="font-medium">{curr.symbol}</span>
                <span>{curr.code}</span>
                <span className="text-zinc-400">- {curr.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isUpdating && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        </div>
      )}
    </div>
  );
}
