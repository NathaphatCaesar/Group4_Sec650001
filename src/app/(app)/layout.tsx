import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Bell, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SideNav, MobileNav, type NavItem } from '@/components/NavLinks';
import { SearchBox } from '@/components/SearchBox';
import { UserMenu } from '@/components/UserMenu';
import { ComposerModal, ComposeButton } from '@/components/Composer';
import { AccentStyle } from '@/components/AccentStyle';
import { getMe, getSubjects, getPendingReportCount } from '@/lib/data';
import { getT } from '@/lib/i18n/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [t, me] = await Promise.all([getT(), getMe()]);
  if (!me) redirect('/login');

  const [subjects, pendingReports] = await Promise.all([
    getSubjects(),
    me.role === 'admin' ? getPendingReportCount() : Promise.resolve(0),
  ]);

  const desktopNav: NavItem[] = [
    { href: '/', label: 'หน้าฟีด', icon: 'Home' },
    { href: '/search', label: 'ค้นหา', icon: 'Search' },
    { href: '/notifications', label: 'การแจ้งเตือน', icon: 'Bell' },
    { href: '/chat', label: 'แชท', icon: 'MessageCircle' },
    { href: '/study', label: 'นัดติวของฉัน', icon: 'CalendarClock' },
    { href: '/leaderboard', label: 'อันดับดาว', icon: 'Trophy' },
    { href: `/u/${me.username}`, label: 'โปรไฟล์', icon: 'User' },
    ...(me.role === 'admin'
      ? [{ href: '/admin/reports', label: 'คิวรายงาน', icon: 'Flag', badge: pendingReports } satisfies NavItem]
      : []),
  ];

  const mobileNav: NavItem[] = [
    { href: '/', label: 'หน้าฟีด', icon: 'Home' },
    { href: '/study', label: 'นัดติว', icon: 'CalendarClock' },
    { action: 'compose', label: 'โพสต์', icon: 'Plus' },
    { href: '/leaderboard', label: 'อันดับดาว', icon: 'Trophy' },
    { href: `/u/${me.username}`, label: 'โปรไฟล์', icon: 'User' },
  ];

  return (
    <div className="min-h-dvh">
      <AccentStyle accent={me.accent} />
      <header
        className="sticky top-0 z-30 border-b border-[color:var(--color-line)] bg-white/90 backdrop-blur"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-2 px-4 md:h-16 md:gap-4">
          <Link href="/" className="flex shrink-0 items-center lg:w-[248px]"><Logo size={40} /></Link>

          <div className="min-w-0 flex-1">
            <Suspense fallback={<div className="skeleton h-11 w-full" />}>
              <SearchBox />
            </Suspense>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Link href="/notifications" aria-label={t('การแจ้งเตือน')} className="relative rounded-full p-2.5 text-ink-soft hover:bg-brand-50">
              <Bell size={20} />
            </Link>
            <Link href="/chat" aria-label={t('แชท')} className="relative rounded-full p-2.5 text-ink-soft hover:bg-brand-50">
              <MessageCircle size={20} />
            </Link>
            <UserMenu me={me} />
          </div>
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-gradient" />
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 pb-24 pt-5 lg:pb-8">
        <aside
          className="sticky hidden h-fit w-[248px] shrink-0 lg:block"
          style={{ top: 'var(--side-nav-top)' }}
        >
          <SideNav items={desktopNav} />
          <ComposeButton className="btn-primary mt-4 w-full" />
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <MobileNav items={mobileNav} />
      <ComposerModal me={me} subjects={subjects} />
    </div>
  );
}
