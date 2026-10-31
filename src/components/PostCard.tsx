'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import clsx from 'clsx';
import {
  Heart, MessageCircle, Share2, MoreHorizontal, Download,
  FileText, CalendarClock, MapPin, Users, Trash2, Pin, Megaphone, Flag,
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { RoleBadge } from '@/components/RoleBadge';
import { TagChip } from '@/components/TagChip';
import { timeAgo, fileSize, compact, meetDate } from '@/lib/utils';
import type { Post } from '@/lib/types';
import { deletePost } from '@/actions/posts';
import { ReportDialog } from '@/components/ReportDialog';
import { useT, useLocale } from '@/lib/i18n/client';

function downloadUrl(url: string, name: string) {
  const u = new URL(url);
  u.searchParams.set('download', name);
  return u.toString();
}

export function PostCard({
  post, meId, isAdmin, dense = false,
}: { post: Post; meId: string | null; isAdmin?: boolean; dense?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);

  const isMine = meId === post.author.id;
  const canDelete = isMine || isAdmin;
  const canReport = Boolean(meId) && !isMine;
  const announceDays = post.announce_until
    ? Math.max(1, Math.ceil((new Date(post.announce_until).getTime() - Date.now()) / 86_400_000))
    : 0;
  const images = post.attachments.filter((a) => a.kind === 'image');
  const files = post.attachments.filter((a) => a.kind === 'file');
  const notReady = t('ยังไม่เปิดใช้งาน');

  if (gone) return null;

  function closeMenu() {
    setMenuOpen(false);
    setConfirming(false);
  }

  function onDelete() {
    closeMenu();
    setGone(true);
    startTransition(async () => {
      const res = await deletePost(post.id);
      if (!res.ok) { setGone(false); setError(t(res.error)); }
      else router.refresh();
    });
  }

  return (
    <article className={clsx('card overflow-hidden', announceDays > 0 && 'card-announce')}>
      {announceDays > 0 ? (
        <p className="flex items-center gap-1.5 border-b border-[color:var(--color-line)] px-5 py-1.5 text-[11px] font-semibold announce-strip">
          <Megaphone size={12} />
          {t('ประกาศ')}
          <span className="ml-auto font-normal opacity-80">
            {t('ปักไว้อีก {n} วัน', { n: announceDays })}
          </span>
        </p>
      ) : null}
      {post.is_pinned ? (
        <p className="flex items-center gap-1.5 border-b border-[color:var(--color-line)] bg-brand-50/60 px-5 py-1.5 text-[11px] font-semibold text-brand-700">
          <Pin size={12} /> {t('ปักหมุดโดยแอดมิน')}
        </p>
      ) : null}

      <div className="flex items-start gap-3 px-5 pt-4">
        <Link href={`/u/${post.author.username}`} className="shrink-0">
          <Avatar name={post.author.display_name} src={post.author.avatar_url} size={42} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/u/${post.author.username}`} className="truncate text-[15px] font-semibold hover:underline">
              {post.author.display_name}
            </Link>
            <span className="hidden truncate text-xs text-ink-soft sm:inline">@{post.author.username}</span>
            <span className="text-xs text-ink-soft">· {timeAgo(post.created_at, locale)}</span>
          </div>
          <RoleBadge
            role={post.author.role}
            studyYear={post.author.study_year}
            faculty={post.author.faculty_name}
            className="mt-0.5"
          />
        </div>

        {canDelete || canReport ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t('ตัวเลือกเพิ่มเติม')}
              className="rounded-full p-2 text-ink-soft transition-colors hover:bg-brand-50"
            >
              <MoreHorizontal size={18} />
            </button>

            {menuOpen ? (
              <>
                <div className="fixed inset-0 z-30" onClick={closeMenu} />
                <div className="card absolute right-0 top-10 z-40 w-56 p-1.5 text-sm">
                  {confirming ? (
                    <div className="px-3 py-2">
                      <p className="font-semibold">{t('ยืนยันการลบโพสต์?')}</p>
                      <p className="mt-1 text-xs text-ink-soft">{t('ลบแล้วกู้คืนไม่ได้')}</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={closeMenu} className="btn-outline flex-1 px-3 py-1.5 text-xs">
                          {t('ยกเลิก')}
                        </button>
                        <button type="button" onClick={onDelete} className="btn-primary flex-1 px-3 py-1.5 text-xs">
                          <Trash2 size={13} /> {t('ลบ')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {canReport ? (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 hover:bg-brand-50"
                          onClick={() => { closeMenu(); setReporting(true); }}
                        >
                          <Flag size={15} /> {t('รายงานโพสต์')}
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-brand-700 hover:bg-brand-50"
                          onClick={() => setConfirming(true)}
                        >
                          <Trash2 size={15} /> {t('ลบโพสต์')}
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {reporting ? (
        <ReportDialog
          postId={post.id}
          onClose={() => setReporting(false)}
          onGone={() => { setGone(true); router.refresh(); }}
        />
      ) : null}

      <div className="px-5 pb-1 pt-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <TagChip tag={post.tag} />
          {post.subject_code ? (
            <span className="chip bg-[color:var(--color-canvas)] px-2.5 py-1 text-xs text-ink-soft">
              {post.subject_code}{post.subject_name ? ` · ${post.subject_name}` : ''}
            </span>
          ) : null}
        </div>

        {post.title ? (
          <p className="block text-[17px] font-semibold leading-snug">{post.title}</p>
        ) : null}

        {post.body ? (
          <p className={clsx('mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90', dense && 'line-clamp-4')}>
            {post.body}
          </p>
        ) : null}

        {post.tag === 'studybuddy' && post.meet_at ? (
          <div className="mt-3 rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CalendarClock size={15} /> {meetDate(post.meet_at, locale)}
              </span>
              {post.meet_place ? (
                <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {post.meet_place}</span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Users size={15} /> {t('เข้าร่วมแล้ว {n} คน', { n: `${post.signup_count}${post.capacity ? `/${post.capacity}` : ''}` })}
              </span>
            </div>
            {post.requires_approval ? (
              <div className="mt-2.5">
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium">
                  {t('ต้องได้รับอนุมัติจากผู้ตั้งกลุ่ม')}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {files.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-1 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-canvas)] pr-2 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
              >
                <a
                  href={f.url ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
                    <FileText size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{f.file_name}</span>
                    <span className="block text-xs text-ink-soft">
                      {fileSize(f.size_bytes)}{f.mime_type?.includes('pdf') ? ' · PDF' : ''}
                    </span>
                  </span>
                </a>
                {f.url ? (
                  <a
                    href={downloadUrl(f.url, f.file_name)}
                    download={f.file_name}
                    aria-label={t('ดาวน์โหลด {name}', { name: f.file_name })}
                    title={t('ดาวน์โหลด')}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-brand-100 hover:text-brand-700"
                  >
                    <Download size={17} />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {images.length ? (
          <div
            className={clsx(
              'mt-3 grid gap-1.5 overflow-hidden rounded-2xl',
              images.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
            )}
          >
            {images.slice(0, 4).map((img) => (
              <img
                key={img.id}
                src={img.url ?? ''}
                alt={img.file_name}
                loading="lazy"
                className={clsx('w-full object-cover', images.length === 1 ? 'max-h-[420px]' : 'h-44')}
              />
            ))}
          </div>
        ) : null}

        {error ? <p className="mt-2 text-xs text-brand-700">{error}</p> : null}
      </div>

      <div className="flex items-center gap-1 px-3 pb-2 pt-1">
        <button type="button" disabled title={notReady} className="btn-ghost gap-2 px-3 opacity-60">
          <Heart size={18} />
          <span className="text-sm tabular-nums">{compact(post.like_count)}</span>
        </button>
        <button
          type="button"
          onClick={() => router.push(`/posts/${post.id}`)}
          className="btn-ghost gap-2 px-3"
        >
          <MessageCircle size={18} />
          <span className="text-sm tabular-nums">
            {compact(post.comment_count)}
          </span>
        </button>
        <button type="button" disabled title={notReady} className="btn-ghost gap-2 px-3 opacity-60">
          <Share2 size={18} />
          <span className="text-sm tabular-nums">{compact(post.share_count)}</span>
        </button>
      </div>
    </article>
  );
}
