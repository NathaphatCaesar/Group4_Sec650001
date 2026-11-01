'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase';
import { getMe } from '@/lib/data';
import type { UserRole } from '@/lib/types';

type ActionResult = { ok: true } | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// แอดมินระงับ/ปลดระงับบัญชีผู้ใช้ บัญชีที่ถูกระงับจะล็อกอินและใช้งานไม่ได้
export async function setUserSuspended(userId: string, suspended: boolean): Promise<ActionResult> {
  const me = await getMe();
  if (!me) return { ok: false, error: 'ยังไม่ได้ล็อกอิน' };
  if (me.role !== 'admin') return { ok: false, error: 'เฉพาะแอดมิน' };
  if (!userId || !UUID_RE.test(userId)) return { ok: false, error: 'ไม่พบผู้ใช้นี้' };
  if (userId === me.id) return { ok: false, error: 'ระงับบัญชีตัวเองไม่ได้' };

  const { data: target } = await db()
    .from('profiles')
    .select('id, role, role_override')
    .eq('id', userId)
    .maybeSingle();
  const row = target as { id: string; role: UserRole; role_override: UserRole | null } | null;
  if (!row) return { ok: false, error: 'ไม่พบผู้ใช้นี้' };
  if ((row.role_override ?? row.role) === 'admin') {
    return { ok: false, error: 'ระงับบัญชีแอดมินไม่ได้' };
  }

  const { error } = await db().from('profiles').update({ is_suspended: suspended }).eq('id', userId);
  if (error) return { ok: false, error: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง' };

  revalidatePath('/admin');
  return { ok: true };
}
