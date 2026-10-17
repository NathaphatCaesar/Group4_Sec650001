'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import clsx from 'clsx';
import { Paperclip, ImagePlus, X, Loader2, CalendarClock, Plus, Globe, Star, Lock, AlertCircle, FileText } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { createPost, type NewAttachment } from '@/actions/posts';
import {
  TAG_META, TAG_ORDER, VISIBILITY_META, VISIBILITY_ORDER,
  POLL_MIN_OPTIONS, POLL_MAX_OPTIONS, POLL_OPTION_MAX,
  type PostTag, type PostVisibility,
} from '@/lib/types';
import { TagIcon } from '@/components/TagIcon';
import { fileSize } from '@/lib/utils';
import type { Me } from '@/lib/data';
import type { Subject } from '@/lib/types';
import { useT } from '@/lib/i18n/client';

const VIS_ICON = { public: Globe, close: Star, private: Lock } as const;

const MAX_FILE = 50 * 1024 * 1024;
const MAX_IMAGE = 10 * 1024 * 1024;

const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.zip', '.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function hasAllowedExtension(fileName: string, kind: 'file' | 'image'): boolean {
  const idx = fileName.lastIndexOf('.');
  if (idx < 0) return false;
  const ext = fileName.slice(idx).toLowerCase();
  return kind === 'image'
    ? ALLOWED_IMAGE_EXTENSIONS.includes(ext)
    : ALLOWED_FILE_EXTENSIONS.includes(ext);
}

export const COMPOSE_EVENT = 'backhome:compose';

export function openComposer(tag?: PostTag) {
  window.dispatchEvent(new CustomEvent(COMPOSE_EVENT, { detail: { tag } }));
}

interface UploadedFile {
  id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number;
  url?: string | null;
}

interface Staged extends NewAttachment {
  localId: string;
}

export function ComposerTrigger({ me }: { me: Me }) {
  const t = useT();

  return (
    <section className="card p-4">
      <div className="flex items-center gap-3">
        <Avatar name={me.display_name} src={me.avatar_url} size={42} frame={me.equipped_frame} />
        <button
          type="button"
          onClick={() => openComposer()}
          className="flex-1 rounded-2xl bg-[color:var(--color-canvas)] px-4 py-3 text-left text-sm text-ink-soft transition-colors hover:bg-brand-50"
        >
          {t('อยากแชร์อะไรวันนี้?')}
        </button>
        <button type="button" onClick={() => openComposer()} className="btn-primary px-5">
          {t('โพสต์')}
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {TAG_ORDER.filter((x) => x !== 'announce' || me.role !== 'student').map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => openComposer(tag)}
            className={clsx('chip px-3 py-1 text-xs font-semibold', TAG_META[tag].tone)}
          >
            <TagIcon tag={tag} /> {t(TAG_META[tag].label)}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ComposerModal({ me, subjects }: { me: Me; subjects: Subject[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [initialTag, setInitialTag] = useState<PostTag>('sheet');

  useEffect(() => {
    function onCompose(e: Event) {
      const tag = (e as CustomEvent<{ tag?: PostTag }>).detail?.tag;
      setInitialTag(tag && (tag !== 'announce' || me.role !== 'student') ? tag : 'sheet');
      setOpen(true);
    }
    window.addEventListener(COMPOSE_EVENT, onCompose);
    return () => window.removeEventListener(COMPOSE_EVENT, onCompose);
  }, [me.role]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center overscroll-none p-0 backdrop-blur-sm sm:items-center sm:p-4"
      style={{ background: 'var(--overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('สร้างโพสต์')}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="modal-panel card flex h-[100dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[88dvh] sm:rounded-[18px]">
        <ComposerForm
          me={me}
          subjects={subjects}
          initialTag={initialTag}
          onClose={() => setOpen(false)}
        />
      </div>
    </div>
  );
}

function ComposerForm({
  me, subjects, initialTag, onClose,
}: { me: Me; subjects: Subject[]; initialTag: PostTag; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  const [tag, setTag] = useState<PostTag>(initialTag);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [meetAt, setMeetAt] = useState('');
  const [meetPlace, setMeetPlace] = useState('');
  const [capacity, setCapacity] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [staged, setStaged] = useState<Staged[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightMissingFile, setHighlightMissingFile] = useState(false);
  const [highlightMissingTitle, setHighlightMissingTitle] = useState(false);
  const [pending, startTransition] = useTransition();

  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const canAnnounce = me.role !== 'student';
  const tags = TAG_ORDER.filter((t) => t !== 'announce' || canAnnounce);

  const canPickVisibility = tag !== 'announce' && tag !== 'studybuddy';

  const upload = useCallback(async (files: FileList | null, kind: 'file' | 'image') => {
    if (!files?.length) return;
    setError(null);
    setHighlightMissingFile(false);
    setUploading(true);

    const picked = Array.from(files);
    const maxBytes = kind === 'image' ? MAX_IMAGE : MAX_FILE;
    const limitLabel = kind === 'image' ? '10 MB' : '50 MB';

    try {
      for (const file of picked) {
        //ตรวจสอบประเภทไฟล์ที่รองรับ (ปฏิเสธ .mp4 หรือไฟล์ที่ไม่รองรับทันที)
        if (!hasAllowedExtension(file.name, kind)) {
          setError(t('ประเภทไฟล์ไม่ถูกต้อง'));
          continue;
        }

        //ตรวจสอบขนาดไฟล์เกินกำหนด
        if (file.size > maxBytes) {
          setError(t('{name} ใหญ่เกิน {size}', { name: file.name, size: limitLabel }));
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('kind', kind);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const payload = (await res.json().catch(() => ({}))) as Partial<UploadedFile> & { error?: string };

        if (!res.ok || !payload.id) {
          setError(t(payload.error ?? 'อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง'));
          continue;
        }

        setStaged((prev) => [
          ...prev,
          {
            localId: `${payload.id}-${Date.now()}`,
            kind,
            file_id: payload.id!,
            file_name: payload.file_name ?? file.name,
            mime_type: payload.mime_type ?? (file.type || null),
            size_bytes: payload.size_bytes ?? file.size,
            url: payload.url ?? null,
          },
        ]);
      }
    } catch {
      setError(t('อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
      if (imageRef.current) imageRef.current.value = '';
    }
  }, [t]);

  function submit() {
    setError(null);
    setHighlightMissingFile(false);
    setHighlightMissingTitle(false);

    // U2 Test Case 2: กรอกข้อมูลอื่นแต่ไม่ได้แนบไฟล์ ปฏิเสธการอัปโหลดและไฮไลต์แจ้งเตือน
    if (tag === 'sheet') {
      if (!title.trim()) {
        setHighlightMissingTitle(true);
        setError(t('กรุณากรอกชื่อชีทสรุปก่อนโพสต์'));
        return;
      }
      if (staged.length === 0) {
        setHighlightMissingFile(true);
        setError(t('กรุณาแนบไฟล์สรุปอย่างน้อย 1 ไฟล์ก่อนกดยืนยัน'));
        return;
      }
    }

    startTransition(async () => {
      const res = await createPost({
        tag,
        title: title || null,
        body,
        subjectCode: subject || null,
        facultyId: me.faculty_id,
        meetAt: meetAt ? new Date(meetAt).toISOString() : null,
        meetPlace: meetPlace || null,
        capacity: capacity ? Number(capacity) : null,
        requiresApproval,
        visibility,
        attachments: staged.map(({ localId: _localId, ...a }) => a),
        options: tag === 'poll' ? pollOptions : undefined,
      });
      if (!res.ok) {
        if (tag === 'sheet' && staged.length === 0) setHighlightMissingFile(true);
        setError(t(res.error));
        return;
      }
      onClose();
      if (pathname !== '/' && !pathname.startsWith('/u/')) router.push('/');
      else router.refresh();
    });
  }

  const busy = pending || uploading;

  return (
    <>
      <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--color-line)] px-5 py-3.5">
        <h2 className="text-base font-semibold">{t('สร้างโพสต์')}</h2>
        <button type="button" onClick={onClose} aria-label={t('ปิด')} className="btn-ghost p-1.5">
          <X size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <Avatar name={me.display_name} src={me.avatar_url} size={40} frame={me.equipped_frame} />
          <div>
            <p className="text-sm font-semibold">{me.display_name}</p>
            <p className="text-[11px] text-ink-soft">
              {t('โพสต์ในนาม {role}', {
                role: t(me.role === 'student' ? 'นักศึกษา' : me.role === 'instructor' ? 'อาจารย์' : 'เจ้าหน้าที่'),
              })}
              {me.faculty_name ? ` · ${me.faculty_name.replace(/^(คณะ|วิทยาลัย)/, '')}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {tags.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => {
                setTag(x);
                setError(null);
                setHighlightMissingFile(false);
                setHighlightMissingTitle(false);
              }}
              className={clsx(
                'chip px-3 py-1 text-xs font-semibold',
                tag === x ? `${TAG_META[x].tone} ring-2 ring-brand-200` : 'bg-[color:var(--color-canvas)] text-ink-soft',
              )}
            >
              {t(TAG_META[x].hash)}
            </button>
          ))}
        </div>

        {canPickVisibility ? (
          <div className="mt-3 rounded-2xl bg-[color:var(--color-canvas)] px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-ink-soft">{t('ใครเห็นโพสต์นี้ได้')}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {VISIBILITY_ORDER.map((v) => {
                const Icon = VIS_ICON[v];
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    aria-pressed={visibility === v}
                    className={clsx(
                      'chip px-3 py-1 text-xs font-semibold',
                      visibility === v
                        ? 'bg-white text-brand-700 ring-2 ring-brand-200'
                        : 'text-ink-soft',
                    )}
                  >
                    <Icon size={13} /> {t(VISIBILITY_META[v].label)}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-soft">{t(VISIBILITY_META[visibility].hint)}</p>
          </div>
        ) : (
          <p className="mt-3 flex items-center gap-1.5 rounded-2xl bg-[color:var(--color-canvas)] px-3.5 py-2.5 text-[11px] text-ink-soft">
            <Globe size={13} />
            {t(tag === 'announce'
              ? 'ประกาศต้องเป็นสาธารณะเสมอ — คน มธ. ทุกคนเห็นได้'
              : 'โพสต์หาเพื่อนติวต้องเป็นสาธารณะ ไม่งั้นไม่มีใครมาเข้าร่วมได้')}
          </p>
        )}

        {tag !== 'general' ? (
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (highlightMissingTitle) setHighlightMissingTitle(false);
            }}
            placeholder={t(
              tag === 'sheet' ? 'ชื่อชีท เช่น ชีทวิชา MATH102 (แคลคูลัส 1)'
                : tag === 'qa' ? 'คำถามของคุณคือ...'
                : tag === 'studybuddy' ? 'รับเพื่อนติว PHY101 (ฟิสิกส์ 1)'
                : tag === 'poll' ? 'คำถามของโพลล์ เช่น จัดติวรอบไหนดี?'
                : 'หัวข้อประกาศ',
            )}
            className={clsx(
              'input mt-3 font-medium',
              highlightMissingTitle && 'ring-2 ring-red-500 bg-red-50/40',
            )}
          />
        ) : null}

        {tag === 'poll' ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-[11px] font-medium text-ink-soft">{t('ตัวเลือกให้โหวต')}</p>
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={opt}
                  maxLength={POLL_OPTION_MAX}
                  onChange={(e) => setPollOptions((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={t('ตัวเลือกที่ {n}', { n: i + 1 })}
                  className="input"
                />
                {pollOptions.length > POLL_MIN_OPTIONS ? (
                  <button
                    type="button"
                    aria-label={t('ลบตัวเลือก')}
                    onClick={() => setPollOptions((p) => p.filter((_, j) => j !== i))}
                    className="btn-ghost shrink-0 p-2"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            ))}
            {pollOptions.length < POLL_MAX_OPTIONS ? (
              <button
                type="button"
                onClick={() => setPollOptions((p) => [...p, ''])}
                className="btn-soft self-start text-xs"
              >
                <Plus size={14} /> {t('เพิ่มตัวเลือก')}
              </button>
            ) : null}
          </div>
        ) : null}

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder={t('เล่ารายละเอียดหน่อย...')}
          className="input mt-2 resize-none"
        />

        <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input">
            <option value="">{t('— เลือกวิชา (ไม่บังคับ) —')}</option>
            {subjects.map((s) => (
              <option key={s.code} value={s.code}>{s.code} · {s.name_th}</option>
            ))}
          </select>

          {tag === 'studybuddy' ? (
            <>
              <label className="relative">
                <CalendarClock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="datetime-local"
                  value={meetAt}
                  onChange={(e) => setMeetAt(e.target.value)}
                  className="input pl-10"
                  aria-label={t('วันเวลานัดติว')}
                />
              </label>
              <input
                value={meetPlace}
                onChange={(e) => setMeetPlace(e.target.value)}
                placeholder={t('สถานที่ เช่น ตึก SC3 ชั้น 2')}
                className="input"
              />
              <input
                type="number"
                min={2}
                max={100}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder={t('รับกี่คน (ไม่บังคับ)')}
                className="input"
              />
              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl bg-[color:var(--color-canvas)] px-3.5 py-2.5 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-500"
                />
                <span className="text-xs leading-relaxed">
                  <span className="font-medium">{t('ต้องให้ฉันอนุมัติก่อนเข้าร่วม')}</span>
                  <span className="mt-0.5 block text-ink-soft">
                    {t(requiresApproval
                      ? 'คนกดขอแล้วต้องรอคุณกดรับ ถึงจะเข้ากลุ่มแชทได้'
                      : 'ตอนนี้ใครกดก็เข้ากลุ่มแชทได้เลย')}
                  </span>
                </span>
              </label>
            </>
          ) : null}
        </div>

        {tag === 'sheet' ? (
          <div
            className={clsx(
              'mt-3 flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 text-xs transition-all',
              highlightMissingFile
                ? 'bg-red-50 text-red-700 ring-2 ring-red-500'
                : 'bg-[color:var(--color-canvas)] text-ink-soft',
            )}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <FileText size={14} className={highlightMissingFile ? 'text-red-600' : 'text-brand-600'} />
              {t('รองรับไฟล์สรุป PDF, DOCX, PPTX, ZIP (ไม่เกิน 50 MB) หรือรูปภาพ (ไม่เกิน 10 MB) · โพสต์พร้อมไฟล์รับ +10 ดาว')}
            </span>
          </div>
        ) : null}

        {staged.length ? (
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {staged.map((a) => (
              <li
                key={a.localId}
                className="flex items-center gap-2 rounded-xl bg-brand-50/70 px-3 py-1.5 text-xs ring-1 ring-brand-200"
              >
                <FileText size={13} className="shrink-0 text-brand-700" />
                <span className="max-w-[200px] truncate font-medium">{a.file_name}</span>
                <span className="text-ink-soft">{fileSize(a.size_bytes)}</span>
                <button
                  type="button"
                  aria-label={t('เอา {name} ออก', { name: a.file_name })}
                  onClick={() => setStaged((p) => p.filter((x) => x.localId !== a.localId))}
                  className="text-ink-soft hover:text-brand-600"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 ring-1 ring-red-200"
          >
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>

      <div
        className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[color:var(--color-line)] px-5 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <input
          ref={fileRef}
          type="file"
          hidden
          multiple
          accept=".pdf,.docx,.pptx,.zip,image/*"
          onChange={(e) => upload(e.target.files, 'file')}
        />
        <input
          ref={imageRef}
          type="file"
          hidden
          multiple
          accept="image/*"
          onChange={(e) => upload(e.target.files, 'image')}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className={clsx(
            'btn-soft text-xs transition-all',
            highlightMissingFile && 'ring-2 ring-red-500 bg-red-50 text-red-700',
          )}
        >
          <Paperclip size={15} /> {t('แนบไฟล์')}
        </button>
        <button
          type="button"
          onClick={() => imageRef.current?.click()}
          disabled={busy}
          className="btn-soft text-xs"
        >
          <ImagePlus size={15} /> {t('เพิ่มรูปภาพ')}
        </button>

        <button type="button" onClick={onClose} className="btn-ghost ml-auto text-xs">{t('ยกเลิก')}</button>
        <button type="button" onClick={submit} disabled={busy} className="btn-primary px-7">
          {busy ? <Loader2 size={15} className="animate-spin" /> : null}
          {t(uploading ? 'กำลังอัปโหลด...' : pending ? 'กำลังโพสต์...' : 'โพสต์')}
        </button>
      </div>
    </>
  );
}

export function ComposeButton({ className, label }: { className?: string; label?: string }) {
  const t = useT();

  return (
    <button type="button" onClick={() => openComposer()} className={className ?? 'btn-primary w-full'}>
      <Plus size={17} /> {label ?? t('สร้างโพสต์')}
    </button>
  );
}
