'use client';

import clsx from 'clsx';
import { GraduationCap, BookUser, Building2, ShieldCheck } from 'lucide-react';
import { ROLE_LABEL, type UserRole } from '@/lib/types';
import { useT } from '@/lib/i18n/client';

const STYLE: Record<UserRole, { cls: string; Icon: typeof GraduationCap }> = {
  student:    { cls: 'bg-brand-50 text-brand-700',       Icon: GraduationCap },
  instructor: { cls: 'bg-indigo-50 text-indigo-700',     Icon: BookUser },
  staff:      { cls: 'bg-teal-50 text-teal-700',         Icon: Building2 },
  admin:      { cls: 'bg-stone-800 text-white',          Icon: ShieldCheck },
};

export function RoleBadge({
  role, studyYear, faculty, className,
}: {
  role: UserRole;
  studyYear?: number | null;
  faculty?: string | null;
  className?: string;
}) {
  const t = useT();
  const { cls, Icon } = STYLE[role];
  const facultyShort = faculty?.replace(/^(คณะ|วิทยาลัย|สถาบัน)/, '') ?? null;

  return (
    <span className={clsx('inline-flex flex-wrap items-center gap-x-1.5 text-[11px]', className)}>
      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold', cls)}>
        <Icon size={11} strokeWidth={2.5} />
        {t(ROLE_LABEL[role])}
      </span>
      {role === 'student' && studyYear ? (
        <span className="text-ink-soft">· {t('ปี {n}', { n: studyYear })}</span>
      ) : null}
      {facultyShort ? <span className="text-ink-soft">· {facultyShort}</span> : null}
    </span>
  );
}
