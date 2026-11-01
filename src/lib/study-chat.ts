import 'server-only';
import crypto from 'node:crypto';
import { db } from '@/lib/supabase';

// แชทกลุ่มนัดติว: ปิดรับข้อความหลังเวลานัด 7 วัน
export const CHAT_OPEN_DAYS_AFTER_MEET = 7;
export const MESSAGE_MAX = 2000;

export interface StudyChatAccess {
  postId: string;
  ownerId: string;
  title: string | null;
  meetAt: string | null;
  closesAt: string | null;
  isOpen: boolean;
  memberIds: string[];
}

export function chatClosesAt(meetAt: string | null): string | null {
  if (!meetAt) return null;
  return new Date(new Date(meetAt).getTime() + CHAT_OPEN_DAYS_AFTER_MEET * 86_400_000).toISOString();
}

/**
 * คืนข้อมูลห้องแชท ถ้า userId เป็นสมาชิก (เจ้าของหรือได้รับอนุมัติ) ไม่งั้นคืน null
 */
export async function getChatAccess(postId: string, userId: string): Promise<StudyChatAccess | null> {
  const { data: post } = await db()
    .from('posts')
    .select('id, author_id, tag, is_hidden, title, meet_at')
    .eq('id', postId)
    .maybeSingle();
  const p = post as { id: string; author_id: string; tag: string; is_hidden: boolean; title: string | null; meet_at: string | null } | null;
  if (!p || p.tag !== 'studybuddy' || p.is_hidden) return null;

  const { data: rows } = await db()
    .from('study_members')
    .select('user_id')
    .eq('post_id', postId)
    .eq('status', 'approved');
  const memberIds = [p.author_id, ...((rows ?? []) as Array<{ user_id: string }>).map((r) => r.user_id)];
  if (!memberIds.includes(userId)) return null;

  const closesAt = chatClosesAt(p.meet_at);
  return {
    postId: p.id,
    ownerId: p.author_id,
    title: p.title,
    meetAt: p.meet_at,
    closesAt,
    isOpen: !closesAt || Date.now() < new Date(closesAt).getTime(),
    memberIds: Array.from(new Set(memberIds)),
  };
}

/**
 * ชื่อ channel ของ Supabase Realtime ที่เดาไม่ได้ ให้เฉพาะสมาชิก
 * ส่งแค่สัญญาณว่ามีข้อความใหม่ เนื้อหาต้องดึงผ่าน API ที่เช็คสิทธิ์เสมอ
 */
export function chatChannelName(postId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const sig = crypto.createHmac('sha256', secret).update(`study-chat:${postId}`).digest('hex').slice(0, 32);
  return `study-chat-${sig}`;
}

export async function broadcastNewMessage(postId: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ topic: chatChannelName(postId), event: 'new', payload: {}, private: false }],
      }),
    });
  } catch (error) {
    console.error('[study-chat] broadcast failed', error);
  }
}

export interface ChatMessage {
  id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
  user: { id: string; username: string; display_name: string; avatar_url: string | null };
}

interface RawMessage {
  id: string;
  user_id: string;
  body: string | null;
  image_id: string | null;
  created_at: string;
}

export async function listMessages(postId: string, after?: string | null, limit = 100): Promise<ChatMessage[]> {
  let query = db()
    .from('study_messages')
    .select('id, user_id, body, image_id, created_at')
    .eq('post_id', postId);
  query = after
    ? query.gt('created_at', after).order('created_at', { ascending: true })
    : query.order('created_at', { ascending: false });
  const { data, error } = await query.limit(limit);
  if (error) {
    console.error('[study-chat] list failed', error.message);
    return [];
  }
  const rows = (data ?? []) as RawMessage[];
  if (!after) rows.reverse();

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const imageIds = rows.map((r) => r.image_id).filter((id): id is string => Boolean(id));
  const [{ data: people }, { data: files }] = await Promise.all([
    userIds.length
      ? db().from('profiles').select('id, username, display_name, avatar_url').in('id', userIds)
      : Promise.resolve({ data: [] }),
    imageIds.length
      ? db().from('files').select('id, public_url').in('id', imageIds)
      : Promise.resolve({ data: [] }),
  ]);
  const personMap = new Map(((people ?? []) as ChatMessage['user'][]).map((u) => [u.id, u]));
  const fileMap = new Map(((files ?? []) as Array<{ id: string; public_url: string }>).map((f) => [f.id, f.public_url]));

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    image_url: r.image_id ? (fileMap.get(r.image_id) ?? `/api/files/${r.image_id}`) : null,
    created_at: r.created_at,
    user: personMap.get(r.user_id) ?? { id: r.user_id, username: 'user', display_name: 'นักศึกษา มธ.', avatar_url: null },
  }));
}
