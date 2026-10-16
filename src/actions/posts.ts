'use server';

export interface NewAttachment {
  kind: 'file' | 'image';
  file_id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number;
}

export async function createPost(_input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: false, error: 'ระบบโพสต์ยังไม่เปิด — ยังไม่มีตาราง posts ในฐานข้อมูล' };
}
