'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subMonths } from "date-fns";

export function MonthFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentMonthParam = searchParams.get('month');
  const now = new Date();
  const currentMonthValue = currentMonthParam || format(now, 'yyyy-MM');

  // Generate last 12 months for options
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy'),
    };
  });

  function handleValueChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', value);
    router.push(`?${params.toString()}`);
  }

  return (
    <Select value={currentMonthValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full bg-white border-zinc-200 rounded-xl shadow-subtle text-zinc-900 focus:ring-zinc-400">
        <SelectValue placeholder="Select Month" />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-zinc-200">
        {months.map((month) => (
          <SelectItem key={month.value} value={month.value} className="text-zinc-700 focus:bg-zinc-100">
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
