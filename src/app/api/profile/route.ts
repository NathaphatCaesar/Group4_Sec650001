import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';
import { rateLimit } from '@/lib/security';

export const runtime = 'nodejs';

const BUCKET = 'attachments';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_BODY_BYTES = MAX_AVATAR_BYTES + 256 * 1024;
const USERNAME_COOLDOWN_MS = 15 * 24 * 60 * 60 * 1000;

const IMAGE_TYPES = {
  jpeg: { mime: 'image/jpeg', extension: 'jpg' },
  png: { mime: 'image/png', extension: 'png' },
  webp: { mime: 'image/webp', extension: 'webp' },
  gif: { mime: 'image/gif', extension: 'gif' },
} as const;

type ImageType = (typeof IMAGE_TYPES)[keyof typeof IMAGE_TYPES];

function detectImageType(bytes: Buffer): ImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return IMAGE_TYPES.jpeg;
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return IMAGE_TYPES.png;
  }
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return IMAGE_TYPES.webp;
  }
  if (bytes.length >= 6 && /^GIF8[79]a$/.test(bytes.toString('ascii', 0, 6))) {
    return IMAGE_TYPES.gif;
  }
  return null;
}

function profileAvatarPath(url: string | null, userId: string): string | null {
  const projectUrl = process.env.SUPABASE_URL;
  if (!projectUrl || !url) return null;

  try {
    const avatar = new URL(url);
    const project = new URL(projectUrl);
    const prefix = `/storage/v1/object/public/${BUCKET}/profile/${userId}/`;
    if (avatar.origin !== project.origin || !avatar.pathname.startsWith(prefix)) return null;

    const filename = decodeURIComponent(avatar.pathname.slice(prefix.length));
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(filename)) return null;
    return `profile/${userId}/${filename}`;
  } catch {
    return null;
  }
}

export async function PATCH(request: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'ยังไม่ได้ล็อกอิน' }, { status: 401 });
  }

  const gate = rateLimit(`profile-edit:${userId}`, { limit: 10, windowMs: 60_000 });
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'แก้ไขโปรไฟล์ถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'คำขอมีขนาดใหญ่เกินกำหนด' }, { status: 413 });
  }

  let formData: FormData;
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data;')) {
      return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
    }

    const reader = request.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        return NextResponse.json({ error: 'คำขอมีขนาดใหญ่เกินกำหนด' }, { status: 413 });
      }
      chunks.push(value);
    }

    formData = await new Response(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))), {
      headers: { 'content-type': contentType },
    }).formData();
  } catch {
    return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
  }

  const displayNameEntry = formData.get('display_name');
  const usernameEntry = formData.get('username');
  const bioEntry = formData.get('bio');
  const avatarEntry = formData.get('avatar');

  if (
    typeof displayNameEntry !== 'string' ||
    typeof usernameEntry !== 'string' ||
    typeof bioEntry !== 'string'
  ) {
    return NextResponse.json(
      { error: 'กรุณาระบุชื่อที่แสดง ชื่อผู้ใช้ และคำแนะนำตัว' },
      { status: 400 },
    );
  }

  const displayName = displayNameEntry.replace(/\s+/g, ' ').trim();
  const username = usernameEntry.trim().toLowerCase();
  const bio = bioEntry.trim() || null;

  if (!displayName || displayName.length > 40) {
    return NextResponse.json({ error: 'ชื่อต้องมีความยาว 1–40 ตัวอักษร' }, { status: 400 });
  }
  if (!/^[a-z0-9._]{3,30}$/.test(username)) {
    return NextResponse.json(
      { error: 'ชื่อผู้ใช้ต้องมี 3–30 ตัว และใช้ได้เฉพาะ a-z, 0-9, จุด หรือขีดล่าง' },
      { status: 400 },
    );
  }
  if (bio && bio.length > 300) {
    return NextResponse.json({ error: 'คำแนะนำตัวต้องไม่เกิน 300 ตัวอักษร' }, { status: 400 });
  }
  if (avatarEntry !== null && (!(avatarEntry instanceof File) || avatarEntry.size === 0)) {
    return NextResponse.json({ error: 'ไฟล์รูปโปรไฟล์ไม่ถูกต้อง' }, { status: 400 });
  }
  if (avatarEntry instanceof File && avatarEntry.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: 'รูปโปรไฟล์ต้องมีขนาดไม่เกิน 2 MB' }, { status: 413 });
  }

  const { data: current, error: profileError } = await db()
    .from('profiles')
    .select('id, username, avatar_url, username_changed_at, is_suspended')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('Could not load profile for editing:', profileError.message);
    return NextResponse.json({ error: 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ' }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ error: 'ไม่พบโปรไฟล์ผู้ใช้' }, { status: 404 });
  }
  if (current.is_suspended) {
    return NextResponse.json({ error: 'บัญชีถูกระงับ' }, { status: 403 });
  }

  let avatarUrl: string | null = null;
  let uploadedPath: string | null = null;

  if (avatarEntry instanceof File) {
    const imageBytes = Buffer.from(await avatarEntry.arrayBuffer());
    const imageType = detectImageType(imageBytes);
    if (!imageType || (avatarEntry.type && avatarEntry.type !== imageType.mime)) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ GIF' }, { status: 415 });
    }

    uploadedPath = `profile/${userId}/${crypto.randomUUID()}.${imageType.extension}`;
    const { error: uploadError } = await db()
      .storage
      .from(BUCKET)
      .upload(uploadedPath, imageBytes, {
        contentType: imageType.mime,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Could not upload profile photo:', uploadError.message);
      return NextResponse.json({ error: 'อัปโหลดรูปโปรไฟล์ไม่สำเร็จ' }, { status: 500 });
    }

    const { data } = db().storage.from(BUCKET).getPublicUrl(uploadedPath);
    avatarUrl = data.publicUrl;
  }

  const { data: updated, error: updateError } = await db().rpc('update_profile_edit', {
    p_user_id: userId,
    p_display_name: displayName,
    p_username: username,
    p_bio: bio,
    p_avatar_url: avatarUrl,
    p_update_avatar: avatarEntry instanceof File,
  });

  if (updateError) {
    if (uploadedPath) {
      const { error: cleanupError } = await db().storage.from(BUCKET).remove([uploadedPath]);
      if (cleanupError) console.error('Could not clean up unused profile photo:', cleanupError.message);
    }

    if (updateError.code === '23505') {
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' }, { status: 409 });
    }
    if (updateError.message.includes('username_cooldown')) {
      const changedAt = current.username_changed_at
        ? new Date(current.username_changed_at).getTime()
        : Date.now();
      const availableAt = new Date(changedAt + USERNAME_COOLDOWN_MS);
      return NextResponse.json(
        { error: 'ยังไม่สามารถเปลี่ยนชื่อผู้ใช้ได้', username_available_at: availableAt.toISOString() },
        { status: 429 },
      );
    }
    if (updateError.message.includes('invalid_username')) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้ไม่ถูกต้อง' }, { status: 400 });
    }
    if (updateError.message.includes('profile_not_found')) {
      return NextResponse.json({ error: 'ไม่พบโปรไฟล์ผู้ใช้' }, { status: 404 });
    }
    if (updateError.message.includes('profile_suspended')) {
      return NextResponse.json({ error: 'บัญชีถูกระงับ' }, { status: 403 });
    }
    if (updateError.code === 'PGRST202') {
      console.error('Profile edit database function is missing; apply database/profile_edit.sql.');
      return NextResponse.json({ error: 'ระบบแก้ไขโปรไฟล์ยังตั้งค่าไม่สมบูรณ์' }, { status: 503 });
    }

    console.error('Could not update profile:', updateError.message);
    return NextResponse.json({ error: 'บันทึกโปรไฟล์ไม่สำเร็จ' }, { status: 500 });
  }

  if (uploadedPath) {
    const previousPath = profileAvatarPath(current.avatar_url, userId);
    if (previousPath) {
      const { error: cleanupError } = await db().storage.from(BUCKET).remove([previousPath]);
      if (cleanupError) console.error('Could not remove previous profile photo:', cleanupError.message);
    }
  }

  return NextResponse.json({ profile: updated });
}
