'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Check, Loader2, Palette, RotateCcw } from 'lucide-react';
import { saveAccent } from '@/actions/settings';
import { ACCENT_PRESETS, DEFAULT_ACCENT, accentCss, type Accent } from '@/lib/accent';
import { useT } from '@/lib/i18n/client';

const PREVIEW_ID = 'bh-accent-preview';
const same = (a: Accent | null, b: Accent | null) =>
  a === b || (!!a && !!b && a.from === b.from && a.to === b.to);

export function AccentSettings({ initial }: { initial: Accent | null }) {
  const t = useT();
  const router = useRouter();
  const [saved, setSaved] = useState<Accent | null>(initial);
  const [accent, setAccent] = useState<Accent | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const shown = accent ?? DEFAULT_ACCENT;
  const solid = shown.from === shown.to;
  const dirty = !same(accent, saved);

  useEffect(() => {
    let el = document.getElementById(PREVIEW_ID) as HTMLStyleElement | null;
    if (!dirty) { el?.remove(); return; }
    if (!el) { el = document.createElement('style'); el.id = PREVIEW_ID; document.head.appendChild(el); }
    el.textContent = accentCss(shown);
  }, [dirty, shown]);
  useEffect(() => () => document.getElementById(PREVIEW_ID)?.remove(), []);

  function pickCustom(key: 'from' | 'to', value: string) {
    setDone(false);
    const base = accent ?? DEFAULT_ACCENT;
    setAccent(solid ? { from: value, to: value } : { ...base, [key]: value });
  }

  function toggleSolid(on: boolean) {
    setDone(false);
    const base = accent ?? DEFAULT_ACCENT;
    setAccent(on ? { from: base.from, to: base.from } : { from: base.from, to: base.to === base.from ? DEFAULT_ACCENT.to : base.to });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveAccent(accent);
      if (!res.ok) { setError(t(res.error)); return; }
      setSaved(accent);
      setDone(true);
      router.refresh();
    });
  }

  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <Palette size={15} /> {t('สีธีม')}
      </h2>
      <p className="mt-1 mb-3 text-xs text-ink-soft">
        {t('เลือกสีของปุ่มและไฮไลต์ทั้งเว็บ ผูกกับบัญชี เปิดเครื่องไหนก็เป็นสีนี้')}
      </p>

      {}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ACCENT_PRESETS.map((p) => {
          const a = p.accent ?? DEFAULT_ACCENT;
          const active = same(accent, p.accent);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => { setDone(false); setAccent(p.accent); }}
              aria-pressed={active}
              className={clsx(
                'flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 transition-colors',
                active ? 'border-brand-300 bg-brand-50' : 'border-[color:var(--color-line)] hover:bg-brand-50/50',
              )}
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ backgroundImage: `linear-gradient(120deg, ${a.from}, ${a.to})` }}
              >
                {active ? <Check size={15} className="text-white drop-shadow" /> : null}
              </span>
              <span className="truncate text-[11px] font-medium">{t(p.name)}</span>
            </button>
          );
        })}
      </div>

      {}
      <div className="mt-4 rounded-2xl bg-[color:var(--color-canvas)] p-3.5">
        <p className="mb-2.5 text-[11px] font-semibold text-ink-soft">{t('ตั้งเอง (RGB)')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <ColorField id="accent-from" label={t(solid ? 'สี' : 'สีเริ่ม')} value={shown.from} onChange={(v) => pickCustom('from', v)} />
          {!solid ? (
            <ColorField id="accent-to" label={t('สีปลาย')} value={shown.to} onChange={(v) => pickCustom('to', v)} />
          ) : null}
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              id="accent-solid"
              type="checkbox"
              checked={solid}
              onChange={(e) => toggleSolid(e.target.checked)}
              className="h-4 w-4 accent-[color:var(--color-brand-500)]"
            />
            {t('สีเดียว ไม่ไล่สี')}
          </label>
        </div>
      </div>

      {}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <span className="btn-primary pointer-events-none px-5">{t('ปุ่มตัวอย่าง')}</span>
        <span className="chip bg-brand-gradient text-on-brand">{t('ที่เลือกอยู่')}</span>
        <span className="chip bg-brand-50 text-brand-700">{t('ไฮไลต์')}</span>
        <span className="text-sm font-semibold text-brand-700">{t('ลิงก์')}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} disabled={!dirty || pending} className="btn-primary px-6">
          {pending ? <Loader2 size={15} className="animate-spin" /> : null} {t('บันทึกสี')}
        </button>
        {accent ? (
          <button type="button" onClick={() => { setDone(false); setAccent(null); }} className="btn-ghost text-xs">
            <RotateCcw size={13} /> {t('กลับไปใช้ค่าเริ่มต้น')}
          </button>
        ) : null}
        {dirty && !pending ? (
          <button type="button" onClick={() => setAccent(saved)} className="btn-ghost text-xs">{t('ยกเลิก')}</button>
        ) : null}
        {done && !dirty ? <span className="text-xs text-emerald-600">{t('บันทึกแล้ว')}</span> : null}
      </div>
      {error ? <p className="mt-2 text-sm text-brand-700">{error}</p> : null}
    </section>
  );
}

function ColorField({
  id, label, value, onChange,
}: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] py-1.5 pl-1.5 pr-3">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
      />
      <span className="text-xs">
        <span className="block text-ink-soft">{label}</span>
        <span className="font-mono font-semibold uppercase">{value}</span>
      </span>
    </label>
  );
}
