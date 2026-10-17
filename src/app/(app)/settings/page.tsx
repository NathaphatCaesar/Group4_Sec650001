import { Lock } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleBadge } from '@/components/RoleBadge';
import { Avatar } from '@/components/Avatar';
import { LanguageSettings } from '@/components/LanguageSettings';
import { AccentSettings } from '@/components/AccentSettings';
import { getMe } from '@/lib/data';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const t = await getT();
  return { title: `${t('ตั้งค่า')} — BACKHOME TU` };
}

export default async function SettingsPage() {
  const [t, me] = await Promise.all([getT(), getMe()]);
  if (!me) return null;

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      <h1 className="px-1 text-lg font-bold">{t('ตั้งค่า')}</h1>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold">{t('บัญชีของคุณ')}</h2>
        <div className="flex items-center gap-3">
          <Avatar name={me.display_name} src={me.avatar_url} size={52} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{me.display_name}</p>
            <p className="text-sm text-ink-soft">@{me.username}</p>
            <RoleBadge role={me.role} studyYear={me.study_year} faculty={me.faculty_name} className="mt-1" />
          </div>
        </div>
        <dl className="mt-4 rounded-2xl bg-[color:var(--color-canvas)] px-4 py-3 text-xs leading-relaxed text-ink-soft">
          <div className="flex gap-2">
            <dt className="shrink-0">{t('ชื่อจริงในระบบ มธ.')}</dt>
            <dd className="min-w-0 flex-1 font-medium text-ink">
              {me.real_name ?? t('ไม่มี')}
              <span className="ml-1.5 inline-flex items-center gap-1 font-normal text-ink-soft">
                <Lock size={11} /> {t('เห็นเฉพาะคุณกับแอดมิน')}
              </span>
            </dd>
          </div>
          {me.student_id ? (
            <div className="mt-1 flex gap-2">
              <dt className="shrink-0">{t('รหัสนักศึกษา')}</dt>
              <dd className="font-medium text-ink">{me.student_id}</dd>
            </div>
          ) : null}
          <p className="mt-2">
            {t('ป้าย role คณะ และชั้นปี ดึงจากบัญชี มธ. ผ่าน TU API ทุกครั้งที่ล็อกอิน — แก้เองไม่ได้ ถ้าข้อมูลผิดให้แจ้งแอดมิน · ชื่อที่คนอื่นเห็นเปลี่ยนได้ที่หน้าโปรไฟล์')}
          </p>
        </dl>
      </section>

      <LanguageSettings />

      <section className="card p-5">
        <h2 className="text-sm font-semibold">{t('ธีม')}</h2>
        <p className="mt-1 mb-3 text-xs text-ink-soft">{t('เลือกโหมดสว่าง/มืด หรือให้เปลี่ยนตามการตั้งค่าของเครื่อง')}</p>
        <ThemeToggle />
      </section>

      <AccentSettings initial={me.accent} />
    </div>
  );
}
