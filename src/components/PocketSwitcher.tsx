'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SharePocketDialog } from '@/components/SharePocketDialog';

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

  const selectedPocket = pockets.find(p => p.id === currentPocketId);

  return (
    <div className="flex items-center gap-2">
      <Select value={currentPocketId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[180px] h-8 text-xs font-medium bg-background/50 border-input/50 backdrop-blur">
          <SelectValue placeholder="All Pockets" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Pockets</SelectItem>
          {pockets.map((pocket) => (
            <SelectItem key={pocket.id} value={pocket.id}>
              {pocket.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedPocket && (
        <SharePocketDialog pocketId={selectedPocket.id} pocketName={selectedPocket.name} />
      )}
    </div>
  );
}
