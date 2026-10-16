'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Home, Search, Bell, MessageCircle, User, Trophy, Flag, Settings, CalendarClock, Plus, LayoutDashboard } from 'lucide-react';
import { openComposer } from '@/components/Composer';
import { useT } from '@/lib/i18n/client';

const ICONS = { Home, Search, Bell, MessageCircle, User, Trophy, Flag, Settings, CalendarClock, Plus, LayoutDashboard };

export interface NavItem {

  href?: string;

  action?: 'compose';
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
}

export function SideNav({ items }: { items: NavItem[] }) {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const href = item.href ?? '/';
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[15px] font-medium transition-colors',
              active ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-brand-50/60',
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            <span className="flex-1">{t(item.label)}</span>
            {item.badge ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-gradient px-1.5 text-[11px] font-bold text-on-brand">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--color-line)] bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch">
        {items.map((item) => {
          const Icon = ICONS[item.icon];

          if (item.action === 'compose') {
            return (
              <button
                key="compose"
                type="button"
                onClick={() => openComposer()}
                aria-label={t('สร้างโพสต์')}
                className="flex flex-1 flex-col items-center justify-start pt-1.5"
              >
                <span className="grid h-11 w-11 -translate-y-3 place-items-center rounded-2xl bg-[color:var(--color-jade-500)] text-white shadow-[0_6px_16px_-4px_rgb(18_165_148/0.6)] transition-transform active:scale-95">
                  <Plus size={23} strokeWidth={2.6} />
                </span>
                <span className="-mt-2 text-[10px] font-semibold text-[color:var(--color-jade-600)]">
                  {t(item.label)}
                </span>
              </button>
            );
          }

          const href = item.href ?? '/';
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium',
                active ? 'text-brand-600' : 'text-ink-soft',
              )}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 2} />
              {t(item.label)}
              {item.badge ? (
                <span className="absolute right-[22%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-gradient px-1 text-[9px] font-bold text-on-brand">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
