import 'server-only';
import crypto from 'node:crypto';
import { db } from '@/lib/supabase';
import { entryYearFromStudentId, inferRole, levelFromDepartment, type TuVerifyResponse } from '@/lib/tu-api';

export class AuthError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Row = Record<string, unknown>;

async function matchFaculty(name: string | null): Promise<string | null> {
  if (!name) return null;
  const { data: exact } = await db().from('faculties').select('id').eq('name_th', name).maybeSingle();
  if (exact) return (exact as { id: string }).id;

  const stripped = name.replace(/^(คณะ|วิทยาลัย)/, '').trim();
  if (!stripped) return null;
  const { data: like } = await db().from('faculties').select('id').ilike('name_th', `%${stripped}%`).limit(1);
  return ((like ?? []) as Array<{ id: string }>)[0]?.id ?? null;
}

async function uniqueUsername(tuUsername: string): Promise<string> {
  const base = tuUsername.replace(/[^a-z0-9._]/g, '') || 'user';
  let candidate = base;
  for (let i = 2; i < 22; i++) {
    const { data } = await db().from('profiles').select('id').eq('username', candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}${i}`;
  }
  return `${base}.${crypto.randomUUID().slice(0, 4)}`;
}

function clean(value: string | null | undefined): string | null {
  const v = value?.replace(/\s+/g, ' ').trim();
  return v ? v : null;
}

export async function syncTuUser(v: TuVerifyResponse, typedUsername: string): Promise<Row> {
  const tuUsername = (clean(v.username) ?? typedUsername).toLowerCase();

  const { data: existing, error: findError } = await db()
    .from('profiles')
    .select('*')
    .eq('tu_username', tuUsername)
    .maybeSingle();
  if (findError) throw new Error(`หาโปรไฟล์ไม่สำเร็จ: ${findError.message}`);

  if (existing && (existing as Row).is_suspended) {
    throw new AuthError('บัญชีนี้ถูกระงับการใช้งาน ติดต่อผู้ดูแลระบบ', 403);
  }

  const studentId = /^\d{10}$/.test(tuUsername) ? tuUsername : null;
  const facultyName = clean(v.faculty) ?? clean(v.organization);

  const fields: Row = {
    display_name_th: clean(v.displayname_th),
    display_name_en: clean(v.displayname_en),
    email: clean(v.email)?.toLowerCase() ?? null,
    role: inferRole(v),
    faculty_name: facultyName,
    faculty_id: await matchFaculty(facultyName),
    department: clean(v.department),
    level_name: levelFromDepartment(v.department),
    tu_status: clean(v.tu_status),
    is_verified: true,
    last_login_at: new Date().toISOString(),
  };
  if (studentId) {
    fields.student_id = studentId;
    fields.entry_year_be = entryYearFromStudentId(studentId);
  }

  if (existing) {
    const { data, error } = await db()
      .from('profiles')
      .update(fields)
      .eq('id', (existing as Row).id as string)
      .select('*')
      .single();
    if (error) throw new Error(`อัปเดตโปรไฟล์ไม่สำเร็จ: ${error.message}`);
    return data as Row;
  }

  const displayName = (clean(v.displayname_th) ?? clean(v.displayname_en) ?? tuUsername).slice(0, 40);
  const { data, error } = await db()
    .from('profiles')
    .insert({
      ...fields,
      tu_username: tuUsername,
      username: await uniqueUsername(tuUsername),
      display_name: displayName,
      onboarded_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw new Error(`สร้างโปรไฟล์ไม่สำเร็จ: ${error.message}`);
  return data as Row;
}
