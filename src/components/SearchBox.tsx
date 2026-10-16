'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useT } from '@/lib/i18n/client';

export function SearchBox({ placeholder }: { placeholder?: string }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search');
      }}
      className="relative w-full"
      role="search"
    >
      <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder ?? t('ค้นหากระทู้, ชีท, คน, วิชา, หรือแท็ก...')}
        aria-label={t('ค้นหา')}
        className="input pl-11"
      />
    </form>
  );
}
