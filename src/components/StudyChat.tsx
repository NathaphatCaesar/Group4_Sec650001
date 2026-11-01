'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { createClient } from '@supabase/supabase-js';
import { ImagePlus, Send, X } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import type { ChatMessage } from '@/lib/study-chat';
import { timeAgo } from '@/lib/utils';
import { useT, useLocale } from '@/lib/i18n/client';

const MAX_IMAGE = 10 * 1024 * 1024;
const FALLBACK_POLL_MS = 5000;

interface Member { id: string; display_name: string; avatar_url: string | null }

// U14: ห้องแชทกลุ่มนัดติว รับสัญญาณข้อความใหม่ผ่าน Supabase Realtime (broadcast ไม่มีเนื้อหา)
// แล้วดึงข้อความจริงผ่าน API ที่เช็คสิทธิ์ ถ้าไม่ได้ตั้ง realtime จะดึงทุก 5 วินาทีแทน
export function StudyChat({
  postId, meId, initial, isOpen, members, realtime,
}: {
  postId: string;
  meId: string;
  initial: ChatMessage[];
  isOpen: boolean;
  members: Member[];
  realtime: { url: string; anonKey: string; channel: string } | null;
}) {
  const t = useT();
  const locale = useLocale();
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ id: string; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastAt = useRef(initial.at(-1)?.created_at ?? null);

  const fetchNew = useCallback(async () => {
    const qs = lastAt.current ? `?after=${encodeURIComponent(lastAt.current)}` : '';
    const res = await fetch(`/api/study/${postId}/messages${qs}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { messages: ChatMessage[] };
    if (!data.messages.length) return;
    lastAt.current = data.messages.at(-1)!.created_at;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
    });
  }, [postId]);

  useEffect(() => {
    if (!realtime) {
      const timer = setInterval(fetchNew, FALLBACK_POLL_MS);
      return () => clearInterval(timer);
    }
    const supabase = createClient(realtime.url, realtime.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const channel = supabase
      .channel(realtime.channel)
      .on('broadcast', { event: 'new' }, () => { void fetchNew(); })
      .subscribe((status) => {
        // ต่อใหม่สำเร็จ ดึงข้อความที่อาจพลาดไประหว่างหลุด
        if (status === 'SUBSCRIBED') void fetchNew();
      });
    return () => { void supabase.removeChannel(channel); };
  }, [realtime, fetchNew]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function pickImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE) {
      setError(t('รูปใหญ่เกิน 10 MB'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', 'image');
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.id) throw new Error(json.error || 'อัปโหลดไม่สำเร็จ');
      setImage({ id: json.id, preview: URL.createObjectURL(file) });
    } catch (err) {
      setError(t(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if ((!body && !image) || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/study/${postId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, imageId: image?.id ?? null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'ส่งข้อความไม่สำเร็จ');
      setText('');
      setImage(null);
      await fetchNew();
    } catch (err) {
      setError(t(err instanceof Error ? err.message : 'ส่งข้อความไม่สำเร็จ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex h-[calc(100dvh-14rem)] min-h-[420px] flex-col overflow-hidden">
      <div className="flex gap-1.5 overflow-x-auto border-b border-[color:var(--color-line)] px-4 py-2.5">
        {members.map((m) => (
          <span key={m.id} title={m.display_name} className="shrink-0">
            <Avatar name={m.display_name} src={m.avatar_url} size={28} />
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!messages.length ? (
          <p className="py-10 text-center text-sm text-ink-soft">{t('ยังไม่มีข้อความ เริ่มทักกลุ่มได้เลย')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m, i) => {
              const mine = m.user.id === meId;
              const showName = !mine && messages[i - 1]?.user.id !== m.user.id;
              return (
                <li key={m.id} className={clsx('flex items-end gap-2', mine && 'flex-row-reverse')}>
                  {!mine ? <Avatar name={m.user.display_name} src={m.user.avatar_url} size={28} /> : null}
                  <div className={clsx('flex max-w-[75%] flex-col gap-1', mine ? 'items-end' : 'items-start')}>
                    {showName ? <span className="px-1 text-[11px] text-ink-soft">{m.user.display_name}</span> : null}
                    {m.image_url ? (
                      <a href={m.image_url} target="_blank" rel="noreferrer">
                        <img src={m.image_url} alt="" className="max-h-64 rounded-2xl border border-[color:var(--color-line)] object-cover" />
                      </a>
                    ) : null}
                    {m.body ? (
                      <p className={clsx(
                        'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm',
                        mine ? 'bg-brand-500 text-white' : 'bg-[color:var(--color-canvas)]',
                      )}>
                        {m.body}
                      </p>
                    ) : null}
                    <span className="px-1 text-[10px] text-ink-soft">{timeAgo(m.created_at, locale)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {isOpen ? (
        <form onSubmit={send} className="border-t border-[color:var(--color-line)] p-3">
          {image ? (
            <div className="relative mb-2 inline-block">
              <img src={image.preview} alt="" className="h-20 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label={t('เอารูปออก')}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-stone-800 text-white"
              >
                <X size={13} />
              </button>
            </div>
          ) : null}
          {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => pickImage(e.target.files)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              aria-label={t('แนบรูป')}
              className="btn-ghost shrink-0 p-2.5"
            >
              <ImagePlus size={20} />
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send(e);
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder={t('พิมพ์ข้อความ…')}
              className="input max-h-32 min-h-[44px] flex-1 resize-none"
            />
            <button type="submit" disabled={busy || (!text.trim() && !image)} aria-label={t('ส่ง')} className="btn-primary shrink-0 p-2.5">
              <Send size={18} />
            </button>
          </div>
        </form>
      ) : (
        <p className="border-t border-[color:var(--color-line)] p-3 text-center text-xs text-ink-soft">
          {t('แชทนี้ปิดแล้ว อ่านข้อความย้อนหลังได้อย่างเดียว')}
        </p>
      )}
    </div>
  );
}
