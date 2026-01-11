import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIDR(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string | number, options: Intl.DateTimeFormatOptions = {}) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    ...options,
    timeZone: 'Asia/Jakarta',
  }).format(d);
}
