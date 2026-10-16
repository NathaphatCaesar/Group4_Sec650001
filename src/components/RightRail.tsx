import Link from 'next/link';
import { Star, Trophy, Sparkles } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { RoleBadge } from '@/components/RoleBadge';
import { getSuggestedUsers, type Me } from '@/lib/data';
import { compact } from '@/lib/utils';
import { getT } from '@/lib/i18n/server';

export async function RightRail({ me }: { me: Me }) {
  const [t, suggested] = await Promise.all([getT(), getSuggestedUsers(me.id, 4)]);

  return (
    <aside className="hidden w-[330px] shrink-0 flex-col gap-3 xl:flex">
      {suggested.length ? (
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold">{t('แนะนำให้ติดตาม')}</h2>
          <ul className="flex flex-col gap-3">
            {suggested.map((u) => (
              <li key={u.id} className="flex items-center gap-2.5">
                <Link href={`/u/${u.username}`}>
                  <Avatar name={u.display_name} src={u.avatar_url} size={38} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${u.username}`} className="block truncate text-sm font-semibold hover:underline">
                    {u.display_name}
                  </Link>
                  <RoleBadge role={u.role} studyYear={u.study_year} faculty={u.faculty_name} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card p-4">
        <h2 className="mb-2 text-sm font-semibold">{t('สถิติของคุณ')}</h2>
        <p className="flex items-baseline gap-1.5">
          <Star size={18} className="fill-amber-400 text-amber-400" />
          <span className="text-2xl font-bold tabular-nums">{compact(me.stars)}</span>
          <span className="text-sm text-ink-soft">{t('ดาว')}</span>
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--color-canvas)]">
          <div className="h-full w-[8%] rounded-full bg-gradient-to-r from-brand-300 to-brand-500" />
        </div>
        <p className="mt-2 text-xs text-ink-soft">{t('โพสต์ชีทดี ๆ แล้วเก็บดาวเพิ่มได้อีกนะ')}</p>
      </section>

      <section className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <Trophy size={15} className="text-amber-500" /> {t('Top 5 ผู้มีดาวสูงสุด')}
          </h2>
        </div>
        <p className="text-xs text-ink-soft">{t('ยังไม่มีข้อมูล')}</p>
      </section>

      <section className="card bg-gradient-to-br from-brand-50 to-amber-50 p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles size={15} className="text-amber-500" aria-hidden /> {t('แชร์ชีทดี ๆ รับดาวไปเลย')}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          {t('โพสต์ #ชีท พร้อมไฟล์ +10 ดาว · มีคนถูกใจ +1 ดาว · คำตอบถูกเลือก +25 ดาว')}
        </p>
      </section>
    </aside>
  );
}
