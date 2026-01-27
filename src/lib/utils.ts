import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatCurrency } from './currency';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @deprecated Use formatCurrency from '@/lib/currency' or useCurrency hook instead
 */
export function formatIDR(amount: number | string) {
  return formatCurrency(amount, 'IDR');
}

export function formatDate(date: Date | string | number, options: Intl.DateTimeFormatOptions = {}) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    ...options,
    timeZone: 'Asia/Jakarta',
  }).format(d);
}
