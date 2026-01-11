'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function SearchInput({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [text, setText] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      const currentQ = searchParams.get('q') || '';
      if (currentQ === text) return;

      const params = new URLSearchParams(searchParams.toString());
      if (text) {
        params.set('q', text);
      } else {
        params.delete('q');
      }
      router.replace(`?${params.toString()}`);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [text, router, searchParams]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
