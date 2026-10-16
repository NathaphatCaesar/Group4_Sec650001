'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { SlidersHorizontal, X, Search, Check } from 'lucide-react';
import { TAG_META, TAG_ORDER, type Faculty, type FeedSort, type PostTag, type Subject } from '@/lib/types';
import { TagIcon } from '@/components/TagIcon';
import { useT } from '@/lib/i18n/client';

interface Draft { tag: PostTag | null; subject: string | null; faculty: string | null; sort: FeedSort }

const SCOPES = [
  { key: 'all', label: 'ฟีดรวม' },
  { key: 'following', label: 'ที่ติดตาม' },
  { key: 'bookmarks', label: 'ที่บันทึก' },
] as const;

export function FeedToolbar({ subjects, faculties }: { subjects: Subject[]; faculties: Faculty[] }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const scope = params.get('scope') ?? 'all';
  const current: Draft = {
    tag: (TAG_ORDER as string[]).includes(params.get('tag') ?? '') ? (params.get('tag') as PostTag) : null,
    subject: params.get('subject'),
    faculty: params.get('faculty'),
    sort: params.get('sort') === 'top' ? 'top' : 'new',
  };
  const group = params.get('group');

  function go(mut: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mut(next);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  const setScope = (k: string) => go((p) => { if (k === 'all') p.delete('scope'); else p.set('scope', k); });
  const remove = (...keys: string[]) => go((p) => keys.forEach((k) => p.delete(k)));
  function apply(d: Draft) {
    go((p) => {
      for (const [k, v] of [['tag', d.tag], ['subject', d.subject], ['faculty', d.faculty]] as const) {
        if (v) p.set(k, v); else p.delete(k);
      }
      if (d.sort === 'top') p.set('sort', 'top'); else p.delete('sort');
      if (d.subject) p.delete('group');
    });
    setOpen(false);
  }

  const subjectName = subjects.find((s) => s.code === current.subject)?.name_th;
  const facultyName = faculties.find((f) => f.id === current.faculty)?.name_th;
  const chips: Array<{ label: string; keys: string[] }> = [];
  if (current.sort === 'top') chips.push({ label: t('ยอดนิยม'), keys: ['sort'] });
  if (current.tag) chips.push({ label: t(TAG_META[current.tag].hash), keys: ['tag'] });
  if (current.subject) chips.push({ label: subjectName ? `${current.subject} ${subjectName}` : current.subject, keys: ['subject'] });
  if (group) chips.push({ label: t('กลุ่มวิชา {g}', { g: group }), keys: ['group'] });
  if (current.faculty) chips.push({ label: facultyName ?? current.faculty, keys: ['faculty'] });
  const count = chips.length;

  return (
    <div className="sticky z-20 -mx-1 px-1 pt-1 pb-2" style={{ top: 'var(--below-toolbar-top)', background: 'var(--color-canvas)' }}>
      <div className="flex items-center gap-2">
        <div role="tablist" className="flex min-w-0 flex-1 gap-1 rounded-full bg-[color:var(--color-surface)] p-1 ring-1 ring-[color:var(--color-line)]">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={scope === s.key}
              onClick={() => setScope(s.key)}
              className={clsx(
                'min-w-0 flex-1 truncate rounded-full px-2 py-1.5 text-center text-xs font-semibold transition-colors sm:text-sm',
                scope === s.key ? 'bg-brand-gradient text-on-brand' : 'text-ink-soft hover:bg-brand-50',
              )}
            >
              {t(s.label)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={clsx(
            'relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold ring-1 transition-colors sm:text-sm',
            count ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-[color:var(--color-surface)] text-ink ring-[color:var(--color-line)] hover:bg-brand-50',
          )}
        >
          <SlidersHorizontal size={15} /> {t('ตัวกรอง')}
          {count ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-gradient px-1 text-[11px] font-bold text-on-brand">{count}</span>
          ) : null}
        </button>
      </div>

      {count ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={c.keys.join()}
              type="button"
              onClick={() => remove(...c.keys)}
              className="chip max-w-full bg-[color:var(--color-surface)] py-1 pl-3 pr-2 text-xs font-medium ring-1 ring-[color:var(--color-line)] hover:bg-brand-50"
              aria-label={t('เอา {name} ออก', { name: c.label })}
            >
              <span className="truncate">{c.label}</span> <X size={13} className="shrink-0 text-ink-soft" />
            </button>
          ))}
          <button type="button" onClick={() => remove('tag', 'subject', 'faculty', 'group', 'sort')} className="px-1.5 text-xs font-semibold text-brand-700 hover:underline">
            {t('ล้างทั้งหมด')}
          </button>
        </div>
      ) : null}

      {open ? (
        <FilterSheet
          initial={current}
          subjects={subjects}
          faculties={faculties}
          onApply={apply}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function FilterSheet({
  initial, subjects, faculties, onApply, onClose,
}: {
  initial: Draft; subjects: Subject[]; faculties: Faculty[];
  onApply: (d: Draft) => void; onClose: () => void;
}) {
  const t = useT();
  const [d, setD] = useState<Draft>(initial);
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const pool = d.faculty ? subjects.filter((s) => !s.faculty_id || s.faculty_id === d.faculty) : subjects;
    if (!needle) return pool.slice(0, 8);
    return pool.filter((s) => s.code.toLowerCase().includes(needle) || s.name_th.toLowerCase().includes(needle)).slice(0, 8);
  }, [q, subjects, d.faculty]);
  const picked = subjects.find((s) => s.code === d.subject);

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm sm:items-center sm:p-4"
      style={{ background: 'var(--overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('ตัวกรอง')}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel card flex max-h-[88dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-b-none sm:rounded-[18px]">
        <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--color-line)] px-5 py-3.5">
          <h2 className="text-base font-semibold">{t('ตัวกรอง')}</h2>
          <button type="button" onClick={onClose} aria-label={t('ปิด')} className="btn-ghost p-1.5"><X size={18} /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">
          <Section title={t('เรียงตาม')}>
            <div className="flex gap-1.5">
              {([['new', 'ล่าสุด'], ['top', 'ยอดนิยม']] as const).map(([k, l]) => (
                <Pill key={k} active={d.sort === k} onClick={() => setD({ ...d, sort: k })}>{t(l)}</Pill>
              ))}
            </div>
          </Section>

          <Section title={t('แท็ก')}>
            <div className="flex flex-wrap gap-1.5">
              <Pill active={!d.tag} onClick={() => setD({ ...d, tag: null })}>{t('ทั้งหมด')}</Pill>
              {TAG_ORDER.map((tag) => (
                <Pill key={tag} active={d.tag === tag} onClick={() => setD({ ...d, tag })}>
                  <TagIcon tag={tag} /> {t(TAG_META[tag].label)}
                </Pill>
              ))}
            </div>
          </Section>

          <Section title={t('คณะ')}>
            <select
              id="filter-faculty"
              value={d.faculty ?? ''}
              onChange={(e) => setD({ ...d, faculty: e.target.value || null })}
              className="input"
            >
              <option value="">{t('ทุกคณะ')}</option>
              {faculties.map((f) => <option key={f.id} value={f.id}>{f.name_th}</option>)}
            </select>
          </Section>

          <Section title={t('วิชา')}>
            {picked ? (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm">
                <span className="font-mono text-xs font-semibold text-brand-700">{picked.code}</span>
                <span className="min-w-0 flex-1 truncate">{picked.name_th}</span>
                <button type="button" onClick={() => setD({ ...d, subject: null })} aria-label={t('ล้าง')} className="text-ink-soft"><X size={15} /></button>
              </div>
            ) : null}
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                id="filter-subject"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('ค้นหารหัสหรือชื่อวิชา')}
                className="input pl-10"
              />
            </label>
            <ul className="mt-1.5 divide-y divide-[color:var(--color-line)]">
              {matches.map((s) => (
                <li key={s.code}>
                  <button
                    type="button"
                    onClick={() => setD({ ...d, subject: d.subject === s.code ? null : s.code })}
                    className="flex w-full items-center gap-3 py-2 text-left text-sm hover:bg-brand-50/50"
                  >
                    <span className="w-16 shrink-0 font-mono text-xs font-semibold text-brand-700">{s.code}</span>
                    <span className="min-w-0 flex-1 truncate">{s.name_th}</span>
                    {d.subject === s.code ? <Check size={15} className="shrink-0 text-brand-700" /> : null}
                  </button>
                </li>
              ))}
              {!matches.length ? <li className="py-3 text-center text-xs text-ink-soft">{t('ไม่พบวิชา')}</li> : null}
            </ul>
          </Section>
        </div>

        <footer
          className="flex shrink-0 items-center gap-2 border-t border-[color:var(--color-line)] px-5 py-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <button type="button" onClick={() => setD({ tag: null, subject: null, faculty: null, sort: 'new' })} className="btn-ghost text-sm">
            {t('ล้าง')}
          </button>
          <button type="button" onClick={() => onApply(d)} className="btn-primary ml-auto px-7">{t('ดูผล')}</button>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
      {children}
    </section>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'chip px-3 py-1.5 text-xs font-semibold transition-colors',
        active ? 'bg-brand-gradient text-on-brand' : 'bg-[color:var(--color-canvas)] text-ink-soft ring-1 ring-[color:var(--color-line)] hover:bg-brand-50',
      )}
    >
      {children}
    </button>
  );
}
