'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase';
import { notifyManySafely } from '@/lib/notifications';
import { getMe } from '@/lib/data';
import {
  TAG_ORDER, POLL_MIN_OPTIONS, POLL_MAX_OPTIONS, POLL_OPTION_MAX, type PostTag,
} from '@/lib/types';

const ANNOUNCE_DAYS = 7;
const ANNOUNCE_DAILY_LIMIT = 3;

export interface NewAttachment {
  kind: 'file' | 'image';
  file_id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number;
  url?: string | null;
}

export interface CreatePostInput {
  tag: PostTag;
  title: string | null;
  body: string;
  subjectCode: string | null;
  facultyId: string | null;
  meetAt: string | null;
  meetPlace: string | null;
  capacity: number | null;
  requiresApproval: boolean;
  attachments: NewAttachment[];
  options?: string[];
}

export async function createPost(
  rawInput: CreatePostInput,
): Promise<{ ok: true; id: string; starsAwarded?: number } | { ok: false; error: string }> {
  const me = await getMe();
  if (!me) {
    return { ok: false, error: 'ยังไม่ได้ล็อกอิน' };
  }
  if (me.is_suspended) {
    return { ok: false, error: 'บัญชีถูกระงับ' };
  }

  const tag: PostTag = TAG_ORDER.includes(rawInput.tag) ? rawInput.tag : 'general';
  if (tag === 'announce' && me.role === 'student') {
    return { ok: false, error: 'โพสต์ #ประกาศ ได้เฉพาะอาจารย์และเจ้าหน้าที่' };
  }
  if (tag === 'announce') {
    const { count } = await db()
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', me.id)
      .eq('tag', 'announce')
      .gte('created_at', new Date(Date.now() - 86_400_000).toISOString());
    if ((count ?? 0) >= ANNOUNCE_DAILY_LIMIT) {
      return { ok: false, error: 'โพสต์ประกาศได้วันละ 3 โพสต์ ลองใหม่พรุ่งนี้' };
    }
  }

  const title = rawInput.title?.trim() ? rawInput.title.trim().slice(0, 160) : null;
  const body = (rawInput.body ?? '').trim().slice(0, 5000);
  const attachments = Array.isArray(rawInput.attachments) ? rawInput.attachments : [];

  //การอัปโหลดสรุปเพื่อสะสมผลงาน (#ชีท) ต้องมีชื่อชีทและต้องแนบไฟล์อย่างน้อย 1 ไฟล์
  if (tag === 'sheet') {
    if (!title) {
      return { ok: false, error: 'กรุณากรอกชื่อชีทสรุปก่อนโพสต์' };
    }
    if (attachments.length === 0) {
      return { ok: false, error: 'กรุณาแนบไฟล์สรุปอย่างน้อย 1 ไฟล์ก่อนกดยืนยัน' };
    }
  } else {
    if (!title && !body && attachments.length === 0) {
      return { ok: false, error: 'เขียนอะไรสักหน่อย หรือแนบไฟล์มาด้วยก็ได้' };
    }
  }

  const pollOptions = tag === 'poll'
    ? (Array.isArray(rawInput.options) ? rawInput.options : [])
        .map((o) => String(o ?? '').trim().slice(0, POLL_OPTION_MAX))
        .filter(Boolean)
        .slice(0, POLL_MAX_OPTIONS)
    : [];
  if (tag === 'poll') {
    if (!title && !body) {
      return { ok: false, error: 'ใส่คำถามของโพลล์ด้วย' };
    }
    if (pollOptions.length < POLL_MIN_OPTIONS) {
      return { ok: false, error: 'โพลล์ต้องมีตัวเลือกอย่างน้อย 2 ข้อ' };
    }
  }

  if (tag === 'studybuddy' && !rawInput.meetAt) {
    return { ok: false, error: 'โพสต์หาเพื่อนติวต้องระบุวันเวลานัด' };
  }

  // ตรวจสอบว่าไฟล์แนบทั้งหมดมีอยู่ในตาราง files และเป็นของผู้ใช้คนนี้จริง
  if (attachments.length > 0) {
    const fileIds = attachments.map((a) => a.file_id).filter(Boolean);
    const { data: existingFiles, error: fileErr } = await db()
      .from('files')
      .select('id, owner_id, file_name, mime_type, size_bytes, kind')
      .in('id', fileIds);

    if (fileErr || !existingFiles || existingFiles.length !== fileIds.length) {
      return { ok: false, error: 'ไม่พบไฟล์ หรือไม่มีสิทธิ์เข้าถึง' };
    }

    const unauthorized = (existingFiles as Array<{ owner_id: string }>).some(
      (f) => f.owner_id !== me.id,
    );
    if (unauthorized) {
      return { ok: false, error: 'ไม่มีสิทธิ์อัปโหลดไฟล์' };
    }
  }

  const subjectCode = rawInput.subjectCode?.trim() || null;

  const { data: postRow, error: postErr } = await db()
    .from('posts')
    .insert({
      author_id: me.id,
      tag,
      visibility: 'public',
      title,
      body,
      subject_code: subjectCode,
      faculty_id: rawInput.facultyId ?? me.faculty_id,
      meet_at: rawInput.meetAt || null,
      meet_place: rawInput.meetPlace?.trim() || null,
      capacity: rawInput.capacity ?? null,
      requires_approval: Boolean(rawInput.requiresApproval),
      // ประกาศปักไว้บนฟีด ANNOUNCE_DAYS วัน
      announce_until: tag === 'announce'
        ? new Date(Date.now() + ANNOUNCE_DAYS * 86_400_000).toISOString()
        : null,
    })
    .select('id')
    .single();

  if (postErr || !postRow) {
    return { ok: false, error: 'สร้างโพสต์ไม่สำเร็จ' };
  }

  const postId = (postRow as { id: string }).id;

  if (attachments.length > 0) {
    const rows = attachments.map((a, idx) => ({
      post_id: postId,
      file_id: a.file_id,
      kind: a.kind === 'image' ? 'image' : 'file',
      file_name: a.file_name,
      mime_type: a.mime_type,
      size_bytes: a.size_bytes,
      sort_order: idx,
    }));

    const { error: attachErr } = await db().from('post_attachments').insert(rows);
    if (attachErr) {
      await db().from('posts').delete().eq('id', postId);
      return { ok: false, error: 'บันทึกทะเบียนไฟล์ไม่สำเร็จ' };
    }
  }

  if (pollOptions.length > 0) {
    const { error: pollErr } = await db().from('poll_options').insert(
      pollOptions.map((label, idx) => ({ post_id: postId, label, sort_order: idx })),
    );
    if (pollErr) {
      await db().from('posts').delete().eq('id', postId);
      return { ok: false, error: 'สร้างโพสต์ไม่สำเร็จ' };
    }
  }

  // มอบแต้มสะสมผลงาน +10 ดาว เมื่ออัปโหลดชีทสรุป (#ชีท) พร้อมไฟล์แนบสำเร็จ
  let starsAwarded = 0;
  if (tag === 'sheet' && attachments.length > 0) {
    starsAwarded = 10;
    const nextStars = (me.stars ?? 0) + starsAwarded;
    await db().from('profiles').update({ stars: nextStars }).eq('id', me.id);
    await db().from('star_events').insert({
      user_id: me.id,
      post_id: postId,
      reason: 'โพสต์ #ชีท พร้อมไฟล์',
      delta: starsAwarded,
    });
  }

  // โพสต์ #ประกาศ แจ้งเตือนผู้ติดตามทุกคน
  if (tag === 'announce') {
    const { data: followers } = await db()
      .from('follows')
      .select('follower_id')
      .eq('following_id', me.id);
    await notifyManySafely(
      ((followers ?? []) as Array<{ follower_id: string }>).map((f) => f.follower_id),
      { actorId: me.id, type: 'announce', postId, payload: { title } },
    );
  }

  revalidatePath('/');
  revalidatePath(`/u/${me.username}`);

  return { ok: true, id: postId, starsAwarded };
}

export async function deletePost(
  postId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await getMe();
  if (!me) return { ok: false, error: 'ยังไม่ได้ล็อกอิน' };

  const { data: post } = await db()
    .from('posts')
    .select('id, author_id')
    .eq('id', postId)
    .maybeSingle();

  if (!post) return { ok: false, error: 'ไม่พบโพสต์นี้ หรือถูกลบไปแล้ว' };
  const row = post as { id: string; author_id: string };
  if (row.author_id !== me.id && me.role !== 'admin') {
    return { ok: false, error: 'ลบได้เฉพาะโพสต์ของตัวเอง' };
  }

  await db().from('posts').delete().eq('id', postId);
  revalidatePath('/');
  revalidatePath(`/u/${me.username}`);
  return { ok: true };
}
