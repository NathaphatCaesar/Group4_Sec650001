import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import { StudyChat } from '@/components/StudyChat';
import { getMe } from '@/lib/data';
import { db } from '@/lib/supabase';
import { UUID_PATTERN } from '@/lib/study';
import { chatChannelName, getChatAccess, listMessages } from '@/lib/study-chat';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const t = await getT();
  return { title: `${t('แชทกลุ่มนัดติว')} — BACKHOME TU` };
}

export default async function StudyChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [t, me, { id }] = await Promise.all([getT(), getMe(), params]);
  if (!me) redirect('/login');
  if (!UUID_PATTERN.test(id)) notFound();

  const access = await getChatAccess(id, me.id);
  if (!access) notFound();

  const [messages, { data: people }] = await Promise.all([
    listMessages(id),
    db().from('profiles').select('id, display_name, avatar_url').in('id', access.memberIds),
    // เปิดห้องแล้วถือว่าอ่านแจ้งเตือนข้อความของกลุ่มนี้แล้ว
    db()
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', me.id)
      .eq('type', 'message')
      .eq('post_id', id)
      .is('read_at', null),
  ]);

  const anonKey = process.env.SUPABASE_ANON_KEY ?? null;
  const realtime = anonKey && process.env.SUPABASE_URL
    ? { url: process.env.SUPABASE_URL, anonKey, channel: chatChannelName(id) }
    : null;

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Link href="/study" aria-label={t('กลับ')} className="rounded-full p-2 text-ink-soft hover:bg-brand-50">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{access.title || t('แชทกลุ่มนัดติว')}</h1>
          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <CalendarClock size={13} />
            {t('สมาชิก {n} คน', { n: access.memberIds.length })}
            {access.closesAt ? ` · ${t(access.isOpen ? 'แชทปิดหลังนัด 7 วัน' : 'แชทนี้ปิดแล้ว')}` : ''}
          </p>
        </div>
      </div>

      <StudyChat
        postId={id}
        meId={me.id}
        initial={messages}
        isOpen={access.isOpen}
        members={(people ?? []) as Array<{ id: string; display_name: string; avatar_url: string | null }>}
        realtime={realtime}
      />
    </div>
  );
}
