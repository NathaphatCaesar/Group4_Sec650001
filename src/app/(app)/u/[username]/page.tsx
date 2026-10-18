import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, GraduationCap, Lock } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { RoleBadge } from '@/components/RoleBadge';
import { FollowButton } from '@/components/FollowButton';
import { FeedList } from '@/components/FeedList';
import { getUserProfileAndPosts, getMe } from '@/lib/data';
import { compact, dateOnly } from '@/lib/utils';
import { getLocale, getT } from '@/lib/i18n/server';
import type { PostTag } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TABS: Array<{ key: string; label: string; tag: PostTag | null }> = [
  { key: 'all', label: 'โพสต์ทั้งหมด', tag: null },
  { key: 'sheet', label: 'ชีท', tag: 'sheet' },
  { key: 'qa', label: 'ถาม-ตอบ', tag: 'qa' },
  { key: 'studybuddy', label: 'หาเพื่อนติว', tag: 'studybuddy' },
];

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)} — BACKHOME TU` };
}

export default async function ProfilePage({
  params, searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { username } = await params;
  const sp = await searchParams;
  const tabKey = (Array.isArray(sp.tab) ? sp.tab[0] : sp.tab) ?? 'all';

  const [t, locale, me, data] = await Promise.all([
    getT(), getLocale(), getMe(), getUserProfileAndPosts(decodeURIComponent(username)),
  ]);
  if (!data || !me) notFound();

  const { profile, posts } = data;
  const tab = TABS.find((x) => x.key === tabKey) ?? TABS[0];
  const shown = tab.tag ? posts.filter((p) => p.tag === tab.tag) : posts;

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      <section className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-200 via-brand-100 to-amber-100" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <Avatar
              name={profile.display_name}
              src={profile.avatar_url}
              size={84}
              className="ring-4 ring-white"
            />
            <div className="flex items-center gap-2 pb-1">
              {profile.is_me ? (
                <Link href="/settings" className="btn-outline px-5 py-2 text-sm">{t('ตั้งค่า')}</Link>
              ) : (
                <FollowButton targetId={profile.id} initial={profile.is_following} size="md" />
              )}
            </div>
          </div>

          <h1 className="mt-3 text-xl font-bold">{profile.display_name}</h1>
          <p className="text-sm text-ink-soft">@{profile.username}</p>
          {profile.real_name && profile.real_name !== profile.display_name ? (
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-soft">
              <Lock size={12} />
              {profile.real_name}
              <span className="opacity-70">({t('เห็นเฉพาะคุณกับแอดมิน')})</span>
            </p>
          ) : null}
          <RoleBadge
            role={profile.role}
            studyYear={profile.study_year}
            faculty={profile.faculty_name}
            className="mt-1.5"
          />

          {profile.bio ? <p className="mt-3 whitespace-pre-wrap text-sm">{profile.bio}</p> : null}

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
            {profile.department ? (
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap size={14} /> {profile.department}
                {profile.level_name ? ` · ${profile.level_name}` : ''}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} /> {t('เข้าร่วม {date}', { date: dateOnly(profile.created_at, locale) })}
            </span>
          </dl>

          <div className="mt-4 grid grid-cols-5 gap-2 rounded-2xl bg-[color:var(--color-canvas)] p-3 text-center">
            <Stat label={t('ดาว')} value={profile.stars} accent />
            <Stat label={t('โพสต์')} value={profile.post_count} />
            <Stat label={t('ชีท')} value={profile.sheet_count} />
            <Stat label={t('ผู้ติดตาม')} value={profile.follower_count} />
            <Stat label={t('กำลังติดตาม')} value={profile.following_count} />
          </div>
        </div>
      </section>

      <nav className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-[color:var(--color-line)]">
        {TABS.map((x) => (
          <Link
            key={x.key}
            href={`/u/${profile.username}${x.key === 'all' ? '' : `?tab=${x.key}`}`}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-center text-xs font-medium transition-colors ${
              tab.key === x.key ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-brand-50/60'
            }`}
          >
            {t(x.label)}
          </Link>
        ))}
      </nav>

      <FeedList
        initial={shown}
        meId={me.id}
        isAdmin={me.role === 'admin'}
        emptyTitle={profile.is_me ? 'คุณยังไม่ได้โพสต์อะไรเลย' : 'ยังไม่มีโพสต์'}
        emptyHint={profile.is_me ? 'เริ่มจากแชร์ชีทสักใบ รับไป 10 ดาว' : undefined}
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | null; accent?: boolean }) {
  return (
    <div>
      <p className={`text-base font-bold tabular-nums ${accent ? 'text-amber-600' : ''}`}>
        {value === null ? '—' : compact(value)}
      </p>
      <p className="text-[11px] text-ink-soft">{label}</p>
    </div>
  );
}
