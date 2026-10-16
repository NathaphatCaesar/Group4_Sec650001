'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useT } from '@/lib/i18n/client';

export type Theme = 'system' | 'light' | 'dark';
export const THEME_KEY = 'bh.theme';

const OPTIONS: Array<{ value: Theme; label: string; Icon: typeof Sun }> = [
  { value: 'light',  label: 'สว่าง',      Icon: Sun },
  { value: 'dark',   label: 'มืด',        Icon: Moon },
  { value: 'system', label: 'ตามเครื่อง', Icon: Monitor },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);

  const dark = theme === 'dark'
    || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#141312' : '#f0960f');
}

export function ThemeToggle() {
  const t = useT();
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'system';
    setTheme(saved);
    applyTheme(saved);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if ((localStorage.getItem(THEME_KEY) as Theme | null ?? 'system') === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  function pick(next: Theme) {
    setTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    applyTheme(next);
  }

  return (
    <div className="flex gap-1 rounded-full bg-[color:var(--color-canvas)] p-1">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => pick(value)}
          aria-pressed={theme === value}
          className={clsx(
            'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors',
            theme === value
              ? 'bg-[color:var(--color-surface)] text-brand-600 shadow-[0_1px_3px_rgb(0_0_0/0.08)]'
              : 'text-ink-soft hover:text-ink',
          )}
        >
          <Icon size={15} /> {t(label)}
        </button>
      ))}
    </div>
  );
}
