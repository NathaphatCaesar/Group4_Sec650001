'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase';
import { notifyManySafely } from '@/lib/notifications';
import { getMe } from '@/lib/data';
import {
  REPORT_REASONS, REPORT_DETAIL_MAX,
  type ReportAction, type ReportReason,
} from '@/lib/types';

type ActionResult = { ok: true } | { ok: false; error: string; gone?: boolean };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// U7: นักศึกษารายงานโพสต์ที่ไม่เหมาะสม ต้องเลือกเหตุผลเสมอ แล้วเข้าคิวตรวจของแอดมิน
export async function reportPost(
  postId: string,
  reason: string | null,
  detail?: string | null,
): Promise<ActionResult> {
  const me = await getMe();
  if (!me) return { ok: false, error: 'ยังไม่ได้ล็อกอิน' };

  if (!reason || !(reason in REPORT_REASONS)) {
    return { ok: false, error: 'กรุณาเลือกเหตุผลก่อนส่งรายงาน' };
  }

  // โพสต์ที่ถูกลบหรือถูกซ่อนไปแล้ว ตอบกลับเป็นข้อความปกติ ไม่โยน error
  if (!postId || !UUID_RE.test(postId)) {
    return { ok: false, error: 'ไม่พบเนื้อหาที่จะรายงาน', gone: true };
  }
  const { data: post, error: postErr } = await db()
    .from('posts')
    .select('id, author_id, title, body, is_hidden')
    .eq('id', postId)
    .maybeSingle();
  if (postErr) return { ok: false, error: 'ส่งรายงานไม่สำเร็จ ลองใหม่อีกครั้ง' };
  const row = post as { id: string; author_id: string; title: string | null; body: string; is_hidden: boolean } | null;
  if (!row || row.is_hidden) {
    return { ok: false, error: 'ไม่พบเนื้อหาที่จะรายงาน', gone: true };
  }
  if (row.author_id === me.id) {
    return { ok: false, error: 'รายงานโพสต์ของตัวเองไม่ได้' };
  }

  const cleanDetail = detail?.trim() ? detail.trim().slice(0, REPORT_DETAIL_MAX) : null;
  const excerpt = [row.title, row.body].filter(Boolean).join(' — ').slice(0, 200) || null;

  const { error } = await db().from('reports').insert({
    reporter_id: me.id,
    post_id: row.id,
    post_author_id: row.author_id,
    post_excerpt: excerpt,
    reason: reason as ReportReason,
    detail: cleanDetail,
  });

  // 23505 = unique violation: รายงานโพสต์นี้ไว้แล้วและยังรอตรวจอยู่ ถือว่าสำเร็จ
  if (error && error.code !== '23505') {
    return { ok: false, error: 'ส่งรายงานไม่สำเร็จ ลองใหม่อีกครั้ง' };
  }

  revalidatePath('/admin/reports');
  return { ok: true };
}

// U8: แอดมินตัดสินเคส ซ่อน/ลบโพสต์ (จัดการแล้ว) หรือปิดเคสโดยไม่ทำอะไรกับโพสต์ (ไม่ผิดกฎ)
export async function resolveReport(
  reportId: string,
  action: ReportAction,
  note?: string | null,
): Promise<ActionResult> {
  const me = await getMe();
  if (!me) return { ok: false, error: 'ยังไม่ได้ล็อกอิน' };
  if (me.role !== 'admin') return { ok: false, error: 'เฉพาะแอดมิน' };
  if (!['hide', 'delete', 'dismiss'].includes(action)) {
    return { ok: false, error: 'คำสั่งไม่ถูกต้อง' };
  }
  if (!reportId || !UUID_RE.test(reportId)) {
    return { ok: false, error: 'ไม่พบรายงานนี้', gone: true };
  }

  const { data: report } = await db()
    .from('reports')
    .select('id, post_id, status')
    .eq('id', reportId)
    .maybeSingle();
  const rep = report as { id: string; post_id: string | null; status: string } | null;
  if (!rep) return { ok: false, error: 'ไม่พบรายงานนี้', gone: true };
  if (rep.status !== 'pending') return { ok: false, error: 'เคสนี้ถูกปิดไปแล้ว', gone: true };

  if (action !== 'dismiss' && !rep.post_id) {
    return { ok: false, error: 'เนื้อหาถูกลบไปแล้ว' };
  }

  const resolution = {
    status: action === 'dismiss' ? 'dismissed' : 'actioned',
    action,
    resolution_note: note?.trim() ? note.trim().slice(0, REPORT_DETAIL_MAX) : null,
    resolved_by: me.id,
    resolved_at: new Date().toISOString(),
  };

  // ปิดทุกเคสที่ค้างของโพสต์เดียวกันพร้อมกัน แอดมินจะได้ไม่ต้องตัดสินซ้ำ
  // ต้องปิดเคสก่อนลบโพสต์ เพราะลบแล้ว post_id จะกลายเป็น null
  const closeCases = db().from('reports').update(resolution).eq('status', 'pending');
  const { data: closed, error: closeErr } = rep.post_id
    ? await closeCases.eq('post_id', rep.post_id).select('id, reporter_id')
    : await closeCases.eq('id', rep.id).select('id, reporter_id');
  if (closeErr) return { ok: false, error: 'บันทึกผลการตรวจไม่สำเร็จ' };

  if (action !== 'dismiss' && rep.post_id) {
    const res = action === 'hide'
      ? await db().from('posts').update({ is_hidden: true }).eq('id', rep.post_id)
      : await db().from('posts').delete().eq('id', rep.post_id);
    if (res.error) {
      // จัดการโพสต์ไม่สำเร็จ คืนสถานะเคสกลับเป็นรอตรวจ
      const ids = ((closed ?? []) as Array<{ id: string }>).map((r) => r.id);
      if (ids.length) {
        await db()
          .from('reports')
          .update({ status: 'pending', action: null, resolution_note: null, resolved_by: null, resolved_at: null })
          .in('id', ids);
      }
      return { ok: false, error: 'จัดการโพสต์ไม่สำเร็จ ลองใหม่อีกครั้ง' };
    }
  }

  // แจ้งคนที่รายงานทุกคนว่าเคสถูกจัดการแล้ว
  const reporters = ((closed ?? []) as Array<{ reporter_id: string }>).map((r) => r.reporter_id);
  await notifyManySafely(reporters, {
    actorId: me.id,
    type: 'report_resolved',
    postId: action === 'delete' ? null : rep.post_id,
    payload: { action },
  });

  revalidatePath('/');
  revalidatePath('/admin/reports');
  return { ok: true };
}

