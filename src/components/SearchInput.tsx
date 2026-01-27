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
      <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="pl-10 bg-white border-zinc-200 rounded-xl py-5 text-sm placeholder:text-zinc-400 focus:border-zinc-400 shadow-subtle"
      />
    </div>
  );
}
