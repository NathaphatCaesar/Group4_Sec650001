'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LogOut, Settings, User as UserIcon, Shield, LayoutDashboard } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { RoleBadge } from '@/components/RoleBadge';
import { Stars } from '@/components/Stars';
import { useT } from '@/lib/i18n/client';
import type { Me } from '@/lib/data';

export function UserMenu({ me }: { me: Me }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('เมนูผู้ใช้')}
        className="rounded-full ring-brand-200 transition hover:ring-4"
      >
        <Avatar name={me.display_name} src={me.avatar_url} size={36} frame={me.equipped_frame} />
      </button>

      {open ? (
        <div
          role="menu"
          className="card absolute right-0 top-12 z-50 w-64 overflow-hidden p-1.5"
        >
          <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
            <Avatar name={me.display_name} src={me.avatar_url} size={42} frame={me.equipped_frame} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me.display_name}</p>
              <RoleBadge role={me.role} studyYear={me.study_year} />
              <div className="mt-1"><Stars count={me.stars} /></div>
            </div>
          </div>
          <hr className="my-1 border-[color:var(--color-line)]" />
          <MenuLink href={`/u/${me.username}`} icon={<UserIcon size={16} />} label={t('โปรไฟล์ของฉัน')} onNavigate={() => setOpen(false)} />
          <MenuLink href="/settings" icon={<Settings size={16} />} label={t('ตั้งค่า & แจ้งเตือน LINE')} onNavigate={() => setOpen(false)} />
          {me.role === 'admin' ? (
            <>
              <MenuLink href="/admin" icon={<LayoutDashboard size={16} />} label={t('แดชบอร์ด')} onNavigate={() => setOpen(false)} />
              <MenuLink href="/admin/reports" icon={<Shield size={16} />} label={t('รายงานที่ต้องตรวจ')} onNavigate={() => setOpen(false)} />
            </>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm text-brand-700 hover:bg-brand-50"
          >
            <LogOut size={16} /> {t('ออกจากระบบ')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href, icon, label, onNavigate,
}: { href: string; icon: React.ReactNode; label: string; onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm hover:bg-brand-50"
    >
      {icon} {label}
    </Link>
  );
}
