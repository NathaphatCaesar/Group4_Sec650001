'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase';
import { getMe } from '@/lib/data';
import { TAG_ORDER, VISIBILITY_ORDER, type PostTag, type PostVisibility } from '@/lib/types';

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
  visibility: PostVisibility;
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

  const visibility: PostVisibility =
    tag === 'announce' || tag === 'studybuddy'
      ? 'public'
      : VISIBILITY_ORDER.includes(rawInput.visibility)
      ? rawInput.visibility
      : 'public';

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
      visibility,
      title,
      body,
      subject_code: subjectCode,
      faculty_id: rawInput.facultyId ?? me.faculty_id,
      meet_at: rawInput.meetAt || null,
      meet_place: rawInput.meetPlace?.trim() || null,
      capacity: rawInput.capacity ?? null,
      requires_approval: Boolean(rawInput.requiresApproval),
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
