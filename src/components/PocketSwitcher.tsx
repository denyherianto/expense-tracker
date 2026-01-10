'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Pocket {
  id: string;
  name: string;
}

interface PocketSwitcherProps {
  pockets: Pocket[];
}

export function PocketSwitcher({ pockets }: PocketSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPocketId = searchParams.get('pocketId') || 'all';

  function handleValueChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('pocketId');
    } else {
      params.set('pocketId', value);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <Select value={currentPocketId} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px] h-8 text-xs font-medium bg-background/50 border-input/50 backdrop-blur">
        <SelectValue placeholder="Semua Pocket" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Semua Pocket</SelectItem>
        {pockets.map((pocket) => (
          <SelectItem key={pocket.id} value={pocket.id}>
            {pocket.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
