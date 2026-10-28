import 'server-only';
import webpush from 'web-push';
import { db } from '@/lib/supabase';

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
}

let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn('[push] VAPID keys are missing; push notifications are disabled.');
    configured = false;
    return configured;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@backhome-tu.local',
    publicKey,
    privateKey,
  );
  configured = true;
  return configured;
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Send a push message to every device the users subscribed with.
 * Never throws: push is best-effort on top of in-app notifications.
 */
export async function sendPushToUsers(userIds: string[], message: PushMessage) {
  if (userIds.length === 0 || !ensureConfigured()) return;

  try {
    const { data, error } = await db()
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .in('user_id', [...new Set(userIds)]);
    if (error || !data) return;

    const payload = JSON.stringify({ url: '/notifications', ...message });
    const expired: string[] = [];

    await Promise.all(
      (data as Array<{ id: string; endpoint: string; p256dh: string; auth: string }>).map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            { TTL: 60 * 60 * 24 },
          );
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          // อุปกรณ์ยกเลิกการรับแจ้งเตือนไปแล้ว ลบทิ้ง
          if (status === 404 || status === 410) expired.push(sub.id);
          else console.error('[push] send failed:', status ?? err);
        }
      }),
    );

    if (expired.length) {
      await db().from('push_subscriptions').delete().in('id', expired);
    }
  } catch (err) {
    console.error('[push] unexpected error:', err);
  }
}
