import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';
import { rateLimit } from '@/lib/security';
import { notifySafely } from '@/lib/notifications';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503;

export function errorResponse(status: ErrorStatus, error: string, headers?: HeadersInit) {
  return NextResponse.json({ error }, { status, headers });
}

// ข้อความ error จากฟังก์ชันในฐานข้อมูล (database/study_members.sql) → HTTP status + ข้อความ
const DB_ERRORS: Record<string, [ErrorStatus, string]> = {
  profile_suspended: [403, 'บัญชีถูกระงับ'],
  study_not_found: [404, 'ไม่พบนัดติวนี้'],
  study_is_owner: [409, 'เจ้าของนัดติวขอเข้าร่วมเองไม่ได้'],
  study_closed: [409, 'นัดติวนี้ปิดรับแล้ว'],
  already_requested: [409, 'คุณส่งคำขอหรือเข้าร่วมนัดติวนี้แล้ว'],
  request_rejected: [409, 'คำขอเข้าร่วมนัดติวนี้ถูกปฏิเสธแล้ว'],
  seats_full: [409, 'ที่นั่งเต็มแล้ว'],
  not_owner: [403, 'อนุมัติไม่ได้ — เฉพาะเจ้าของนัดติวเท่านั้น'],
  request_not_found: [404, 'ไม่พบคำขอเข้าร่วมนี้'],
  request_not_pending: [409, 'คำขอนี้ได้รับการพิจารณาไปแล้ว'],
};

export function dbErrorResponse(error: { code?: string; message: string }, context: string) {
  for (const [key, [status, text]] of Object.entries(DB_ERRORS)) {
    if (error.message.includes(key)) return errorResponse(status, text);
  }
  if (error.code === 'PGRST202') {
    console.error('Study database functions are missing; apply database/study_members.sql.');
    return errorResponse(503, 'ระบบนัดติวยังตั้งค่าไม่สมบูรณ์');
  }
  console.error(`[study] ${context} failed:`, error.message);
  return errorResponse(500, 'บันทึกข้อมูลนัดติวไม่สำเร็จ');
}

/**
 * ตรวจ login + rate limit + รูปแบบ id ของนัดติว ที่ทุก endpoint ใช้ร่วมกัน
 */
export async function guard(postId: string, action: string) {
  const userId = await currentUserId();
  if (!userId) return { response: errorResponse(401, 'ยังไม่ได้ล็อกอิน') } as const;

  const gate = rateLimit(`study-${action}:${userId}`, { limit: 30, windowMs: 60_000 });
  if (!gate.ok) {
    return {
      response: errorResponse(429, 'ทำรายการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่', {
        'Retry-After': String(gate.retryAfterSeconds),
      }),
    } as const;
  }

  if (!UUID_PATTERN.test(postId)) return { response: errorResponse(400, 'รหัสนัดติวไม่ถูกต้อง') } as const;
  return { userId } as const;
}

interface DecideResult {
  status: 'approved' | 'rejected';
  title: string | null;
  capacity: number | null;
  signup_count: number;
}

/**
 * เจ้าของนัดติวอนุมัติ/ปฏิเสธคำขอ แล้วแจ้งเตือนผู้ขอ (study_approved / study_rejected)
 */
export async function decideRequest(request: Request, postId: string, approve: boolean) {
  const auth = await guard(postId, 'decide');
  if ('response' in auth) return auth.response;

  const body = await request.json().catch(() => null) as { userId?: unknown } | null;
  if (!body || typeof body.userId !== 'string' || !UUID_PATTERN.test(body.userId)) {
    return errorResponse(400, 'กรุณาระบุผู้ขอเข้าร่วม');
  }
  const applicantId = body.userId;

  const { data, error } = await db().rpc('study_decide_request', {
    p_post_id: postId,
    p_owner_id: auth.userId,
    p_user_id: applicantId,
    p_approve: approve,
  });
  if (error) return dbErrorResponse(error, approve ? 'approve' : 'reject');

  const result = data as DecideResult;
  await notifySafely({
    recipientId: applicantId,
    actorId: auth.userId,
    type: approve ? 'study_approved' : 'study_rejected',
    postId,
    payload: { title: result.title },
  });

  return NextResponse.json({
    ok: true,
    userId: applicantId,
    status: result.status,
    signup_count: result.signup_count,
    capacity: result.capacity,
  });
}
