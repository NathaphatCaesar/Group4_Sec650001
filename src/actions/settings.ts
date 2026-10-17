'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase';
import { currentUserId } from '@/lib/session';
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n';
import { parseAccent, type Accent } from '@/lib/accent';

type ActionResult = { ok: true } | { ok: false; error: string };

export async function setLocale(value: string): Promise<ActionResult> {
  const locale = normalizeLocale(value);
  if (!locale) return { ok: false, error: 'ภาษาไม่ถูกต้อง' };

  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function saveAccent(accent: Accent | null): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'ยังไม่ได้ล็อกอิน' };

  const clean = accent ? parseAccent(accent) : null;
  if (accent && !clean) return { ok: false, error: 'รูปแบบสีไม่ถูกต้อง' };

  const { error } = await db().from('profiles').update({ accent: clean }).eq('id', userId);
  if (error) return { ok: false, error: 'บันทึกสีไม่สำเร็จ ลองใหม่อีกครั้ง' };

  revalidatePath('/', 'layout');
  return { ok: true };
}
