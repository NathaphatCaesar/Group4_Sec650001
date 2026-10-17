//เช็คให้หน่อยว่าเอาไปใช้ได้ไหม
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';
import { rateLimit } from '@/lib/security';

export const runtime = 'nodejs';

const BUCKET = 'attachments';
const MAX_FILE_BYTES = 50 * 1024 * 1024;  // 50 MB สำหรับไฟล์ชีทสรุป (PDF, DOCX, PPTX, ZIP)
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB สำหรับรูปภาพ

const ALLOWED_DOCUMENT_MIMES: Record<string, string[]> = {
  '.pdf':  ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.zip':  ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'],
};

const ALLOWED_IMAGE_MIMES: Record<string, string[]> = {
  '.jpg':  ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png':  ['image/png'],
  '.webp': ['image/webp'],
  '.gif':  ['image/gif'],
};

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

function sanitizeFileName(raw: string): string {
  const base = raw.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim();
  return base.slice(0, 120) || 'sheet.pdf';
}

function sanitizeStorageKey(raw: string): string {
  const ext = getExtension(raw);
  const stem = raw
    .slice(0, raw.length - ext.length)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${stem || 'file'}${ext}`;
}

function resolveValidatedMime(
  fileName: string,
  rawMime: string,
  kind: 'file' | 'image',
): { ok: true; mime: string } | { ok: false } {
  const ext = getExtension(fileName);
  const normalizedMime = (rawMime || '').toLowerCase().trim();

  if (kind === 'image') {
    const allowedMimes = ALLOWED_IMAGE_MIMES[ext];
    if (!allowedMimes) return { ok: false };
    if (normalizedMime && !allowedMimes.includes(normalizedMime)) return { ok: false };
    return { ok: true, mime: allowedMimes[0] };
  }

  const allowedMimes = ALLOWED_DOCUMENT_MIMES[ext] ?? ALLOWED_IMAGE_MIMES[ext];
  if (!allowedMimes) return { ok: false };

  // บล็อกกรณี MIME ระบุเป็น video/* หรือ audio/* ชัดเจน (Test Case 3 เช่น .mp4)
  if (
    normalizedMime &&
    normalizedMime !== 'application/octet-stream' &&
    !allowedMimes.includes(normalizedMime)
  ) {
    return { ok: false };
  }

  return { ok: true, mime: allowedMimes[0] };
}

let bucketChecked = false;
async function ensureStorageBucket() {
  if (bucketChecked) return;
  try {
    const { data: existing } = await db().storage.getBucket(BUCKET);
    if (!existing) {
      await db().storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_BYTES,
        allowedMimeTypes: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/zip',
          'application/x-zip-compressed',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ],
      });
    }
    bucketChecked = true;
  } catch {
    // ถ้าBucket มีอยู่แล้วใน Supabase Storage ให้ทำงานต่อได้ทันที
  }
}

export async function POST(request: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'ยังไม่ได้ล็อกอิน' }, { status: 401 });
    }

    const { data: profile } = await db()
      .from('profiles')
      .select('id, is_suspended')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์อัปโหลดไฟล์' }, { status: 401 });
    }
    if ((profile as { is_suspended: boolean }).is_suspended) {
      return NextResponse.json({ error: 'บัญชีถูกระงับ' }, { status: 403 });
    }

    const gate = rateLimit(`upload:${userId}`, { limit: 25, windowMs: 60_000 });
    if (!gate.ok) {
      return NextResponse.json(
        { error: 'อัปโหลดถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' },
        { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'รูปแบบคำขอไม่ถูกต้อง' }, { status: 400 });
    }

    const fileEntry = formData.get('file');
    const kindParam = formData.get('kind');
    const kind: 'file' | 'image' = kindParam === 'image' ? 'image' : 'file';

    // กรณีไม่ได้แนบไฟล์
    if (!fileEntry || !(fileEntry instanceof File) || fileEntry.size <= 0) {
      return NextResponse.json(
        { error: 'กรุณาแนบไฟล์ที่ต้องการอัปโหลด' },
        { status: 400 },
      );
    }

    const cleanName = sanitizeFileName(fileEntry.name);

    // กรณีอัปโหลดไฟล์ประเภทที่ระบบไม่รองรับ (เช่น .mp4, .exe ฯลฯ)
    const mimeCheck = resolveValidatedMime(cleanName, fileEntry.type, kind);
    if (!mimeCheck.ok) {
      return NextResponse.json(
        { error: 'ประเภทไฟล์ไม่ถูกต้อง' },
        { status: 415 },
      );
    }

    // กรณีอัปโหลดไฟล์ที่มีขนาดใหญ่เกินไป
    const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
    if (fileEntry.size > maxBytes) {
      const limitLabel = kind === 'image' ? '10 MB' : '50 MB';
      return NextResponse.json(
        { error: `${cleanName} ใหญ่เกิน ${limitLabel}` },
        { status: 413 },
      );
    }

    await ensureStorageBucket();

    const now = new Date();
    const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const fileUuid = crypto.randomUUID();
    const safeKey = sanitizeStorageKey(cleanName);
    const storagePath = `u2/${userId}/${ym}/${fileUuid}-${safeKey}`;

    const buffer = Buffer.from(await fileEntry.arrayBuffer());

    const { error: uploadError } = await db()
      .storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeCheck.mime,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `อัปโหลดไม่สำเร็จ: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = db().storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = publicUrlData.publicUrl;

    const { data: inserted, error: dbError } = await db()
      .from('files')
      .insert({
        id: fileUuid,
        owner_id: userId,
        bucket: BUCKET,
        storage_path: storagePath,
        public_url: publicUrl,
        file_name: cleanName,
        mime_type: mimeCheck.mime,
        size_bytes: fileEntry.size,
        kind,
      })
      .select('id, file_name, mime_type, size_bytes, kind, public_url')
      .single();

    if (dbError || !inserted) {
      await db().storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json(
        { error: 'บันทึกทะเบียนไฟล์ไม่สำเร็จ' },
        { status: 500 },
      );
    }

    const row = inserted as {
      id: string;
      file_name: string;
      mime_type: string;
      size_bytes: number;
      kind: 'file' | 'image';
      public_url: string;
    };

    return NextResponse.json(
      {
        id: row.id,
        file_name: row.file_name,
        mime_type: row.mime_type,
        size_bytes: Number(row.size_bytes),
        kind: row.kind,
        url: row.public_url,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
