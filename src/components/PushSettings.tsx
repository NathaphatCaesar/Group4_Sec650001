'use client';

import { useEffect, useState } from 'react';
import { BellRing, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/client';

type Status = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PushSettings({ publicKey }: { publicKey: string | null }) {
  const t = useT();
  const [status, setStatus] = useState<Status>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (!supported) {
        setStatus(isIos() && !isStandalone() ? 'ios-install' : 'unsupported');
        return;
      }
      if (!publicKey) {
        setStatus('unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        setStatus('denied');
        return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.getSubscription();
      setStatus(subscription ? 'on' : 'off');
    }
    check().catch(() => setStatus('unsupported'));
  }, [publicKey]);

  async function enable() {
    if (!publicKey || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off');
        setError(t('เบราว์เซอร์ยังไม่อนุญาตให้แจ้งเตือน'));
        return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) {
        await subscription.unsubscribe();
        throw new Error();
      }
      setStatus('on');
      setMessage(t('เปิดแจ้งเตือนบนอุปกรณ์นี้แล้ว'));
    } catch {
      setError(t('เปิดการแจ้งเตือนไม่สำเร็จ'));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus('off');
      setMessage(t('ปิดแจ้งเตือนบนอุปกรณ์นี้แล้ว'));
    } catch {
      setError(t('ปิดการแจ้งเตือนไม่สำเร็จ'));
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/push/test', { method: 'POST' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error);
      setMessage(t('ส่งแล้ว รอการแจ้งเตือนเด้งขึ้นสักครู่'));
    } catch (err) {
      setError(err instanceof Error && err.message ? t(err.message) : t('ส่งทดสอบไม่สำเร็จ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <BellRing size={15} /> {t('แจ้งเตือนบนอุปกรณ์')}
        {busy ? <Loader2 size={13} className="animate-spin text-ink-soft" /> : null}
      </h2>
      <p className="mt-1 mb-3 text-xs text-ink-soft">
        {t('ให้การแจ้งเตือนเด้งขึ้นบนเครื่อง แม้ไม่ได้เปิดเว็บอยู่')}
      </p>

      {status === 'loading' ? (
        <p className="text-xs text-ink-soft">{t('กำลังโหลด...')}</p>
      ) : null}

      {status === 'unsupported' ? (
        <p className="text-xs text-ink-soft">{t('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนบนอุปกรณ์ — ยังเห็นการแจ้งเตือนในเว็บได้ตามปกติ')}</p>
      ) : null}

      {status === 'ios-install' ? (
        <div className="rounded-2xl bg-[color:var(--color-canvas)] px-4 py-3 text-xs leading-relaxed text-ink-soft">
          <p className="font-medium text-ink">{t('บน iPhone ต้องติดตั้งเป็นแอปก่อน')}</p>
          <ol className="mt-1 list-decimal pl-4">
            <li>{t('เปิดเว็บนี้ใน Safari แล้วกดปุ่มแชร์ (สี่เหลี่ยมมีลูกศรขึ้น)')}</li>
            <li>{t('เลือก “เพิ่มไปยังหน้าจอโฮม”')}</li>
            <li>{t('เปิดแอปจากไอคอนบนหน้าจอโฮม แล้วกลับมาเปิดแจ้งเตือนที่หน้านี้')}</li>
          </ol>
        </div>
      ) : null}

      {status === 'denied' ? (
        <p className="text-xs text-red-600">{t('เบราว์เซอร์บล็อกการแจ้งเตือนไว้ — เปิดใหม่ได้ที่ตั้งค่าเว็บไซต์ในเบราว์เซอร์')}</p>
      ) : null}

      {status === 'off' ? (
        <button type="button" onClick={enable} disabled={busy} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
          {t('เปิดแจ้งเตือนบนเครื่องนี้')}
        </button>
      ) : null}

      {status === 'on' ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={sendTest} disabled={busy} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
            {t('ส่งทดสอบ')}
          </button>
          <button type="button" onClick={disable} disabled={busy} className="btn-outline px-4 py-2 text-sm disabled:opacity-50">
            {t('ปิดแจ้งเตือนบนเครื่องนี้')}
          </button>
        </div>
      ) : null}

      {message ? <p role="status" className="mt-2 text-xs text-ink-soft">{message}</p> : null}
      {error ? <p role="alert" className="mt-2 text-xs text-red-600">{error}</p> : null}
    </section>
  );
}
