'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { safeNextPath } from '@/lib/safe-redirect';
import { Suspense, useEffect, useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useT } from '@/lib/i18n/client';

function Form() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [remember, setRemember] = useState(true);
  const [studentId, setStudentId] = useState('');
  const [needsStudentId, setNeedsStudentId] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bh.tu_username');
      if (saved) { setUsername(saved); setRemember(true); }
    } catch {}
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDetail(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, studentId: studentId || undefined }),
      });
      const data = (await res.json()) as {
        error?: string; detail?: string; needsStudentId?: boolean;
        vars?: Record<string, string | number>;
      };

      if (!res.ok) {
        setError(t(data.error ?? 'ล็อกอินไม่สำเร็จ', data.vars));
        setDetail(data.detail ?? null);
        return;
      }
      setDetail(null);

      if (data.needsStudentId && !studentId) {
        setNeedsStudentId(true);
        setError(t('กรอกรหัสนักศึกษา 10 หลักเพิ่มอีกนิด เพื่อแสดงชั้นปีบนป้ายของคุณ'));
        return;
      }

      try {
        if (remember) localStorage.setItem('bh.tu_username', username.trim());
        else localStorage.removeItem('bh.tu_username');
      } catch {}

      router.replace(safeNextPath(params.get('next')));
      router.refresh();
    } catch {
      setError(t('เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('บัญชี มธ.')}</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          placeholder={t('เช่น 6516680000 หรือ somchai.j')}
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('รหัสผ่าน')}</span>
        <span className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="input pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={t(show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
      </label>

      <label className="flex cursor-pointer items-center gap-2.5 py-0.5">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 accent-brand-500"
        />
        <span className="text-sm text-ink-soft">{t('จำชื่อบัญชีไว้ในเครื่องนี้')}</span>
      </label>

      {needsStudentId ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('รหัสนักศึกษา (10 หลัก)')}</span>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 10))}
            inputMode="numeric"
            placeholder="6516680000"
            className="input"
          />
          <span className="text-xs text-ink-soft">{t('ใช้คำนวณชั้นปี และตรวจสอบกับ TU API ว่าเป็นของคุณจริง')}</span>
        </label>
      ) : null}

      {error ? (
        <div className="rounded-2xl bg-brand-50 px-4 py-2.5 text-sm text-brand-700" role="alert">
          <p>{error}</p>
          {detail ? <p className="mt-1 text-xs opacity-80">{detail}</p> : null}
        </div>
      ) : null}

      <button type="submit" disabled={busy} className="btn-primary mt-1 py-3">
        {busy ? <Loader2 size={16} className="animate-spin" /> : null}
        {t('เข้าสู่ระบบด้วยบัญชี มธ.')}
      </button>

      <p className="mt-2 text-center text-xs text-ink-soft">
        {t('รหัสผ่านของคุณถูกส่งตรงไปยัง TU API เพื่อยืนยันตัวตนเท่านั้น ระบบนี้ไม่เก็บไว้')}
      </p>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="skeleton mt-6 h-72 w-full" />}>
      <Form />
    </Suspense>
  );
}
