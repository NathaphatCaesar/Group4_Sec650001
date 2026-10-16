import { fetchWithTimeout } from '@/lib/security';

const BASE = (process.env.TU_API_BASE || 'https://restapi.tu.ac.th/api/v1').replace(/\/$/, '');

const PATHS = {
  verify: process.env.TU_PATH_VERIFY || '/auth/Ad/verify',
  studentInfo: process.env.TU_PATH_STUDENT_INFO || '/profile/std/info',
  faculty: process.env.TU_PATH_FACULTY || '/common/faculty',
};

export type TuType = 'student' | 'employee';

export interface TuVerifyResponse {
  status: boolean;
  message: string;

  Description?: string;
  type: TuType;
  username: string;
  displayname_th: string;
  displayname_en: string;
  email: string;
  department: string;
  faculty?: string;
  organization?: string;

  tu_status?: string;
  statusid?: string;
  StatusEmp?: string;
}

export interface TuStudentInfo {
  status: boolean;
  username: string;
  displayname_th: string;
  displayname_en: string;
  statusid: string;
  statusname: string;

  department: string;
  faculty: string;
}

export class TuApiError extends Error {

  readonly status: number;

  readonly isUserFault: boolean;
  readonly detail?: string;

  readonly body?: Record<string, unknown>;

  constructor(
    message: string, status: number, isUserFault = false,
    detail?: string, body?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'TuApiError';
    this.status = status;
    this.isUserFault = isUserFault;
    this.detail = detail;
    this.body = body;
  }
}

function apiKey() {
  const key = process.env.TU_API_KEY;
  if (!key) throw new TuApiError('ยังไม่ได้ตั้งค่า TU_API_KEY', 500);
  return key;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {

  const res = await fetchWithTimeout(`${BASE}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Application-Key': apiKey(),
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new TuApiError(`TU API ตอบกลับไม่ใช่ JSON (HTTP ${res.status})`, 502);
  }

  const body = json as { status?: boolean; message?: string; error?: string; Description?: string };

  if (!res.ok || body.status === false) {
    const raw = body.message || body.error || '';

    if (res.status === 401 || res.status === 403 || /application[- ]?key/i.test(raw)) {
      throw new TuApiError(
        'ระบบเชื่อมต่อ TU API ไม่ได้ (Application-Key ไม่ถูกต้อง หรือ channel ยังไม่เปิด service นี้)',
        502, false, raw, body,
      );
    }

    throw new TuApiError(
      raw || `TU API ขัดข้อง (HTTP ${res.status})`,
      502, false, body.Description, body,
    );
  }

  return json as T;
}

export async function tuVerify(username: string, password: string): Promise<TuVerifyResponse> {
  if (process.env.TU_AUTH_MOCK === 'true') return mockVerify(username);

  try {
    const data = await call<TuVerifyResponse>(PATHS.verify, {
      method: 'POST',
      body: JSON.stringify({ UserName: username, PassWord: password }),
    });
    return { ...data, username: data.username || username };
  } catch (err) {
    if (err instanceof TuApiError && err.status !== 502) throw err;
    if (err instanceof TuApiError && /invalid|not found|incorrect|password/i.test(err.message)) {
      throw new TuApiError('บัญชี มธ. หรือรหัสผ่านไม่ถูกต้อง', 401, true, err.detail || err.message);
    }
    throw err;
  }
}

export async function tuStudentInfo(studentId: string): Promise<TuStudentInfo | null> {
  if (process.env.TU_AUTH_MOCK === 'true') {
    return {
      status: true,
      username: studentId,

      displayname_th: `ทดสอบ ${studentId}`,
      displayname_en: `Test ${studentId}`,
      statusid: '10',
      statusname: 'ปกติ',
      faculty: 'คณะวิศวกรรมศาสตร์',
      department: 'ปริญญาตรี สาขาวิชาวิศวกรรมคอมพิวเตอร์',
    };
  }

  try {
    return await call<TuStudentInfo>(`${PATHS.studentInfo}?id=${encodeURIComponent(studentId)}`);
  } catch (err) {
    console.warn('[tu-api] ดึงข้อมูลนักศึกษาเพิ่มไม่ได้ (ข้ามไป):', (err as Error).message);
    return null;
  }
}

export async function tuFaculties(): Promise<Array<{ facultyid: string; faculty_th: string; faculty_en: string }>> {
  return call(PATHS.faculty);
}

export function entryYearFromStudentId(studentId: string | null | undefined): number | null {
  if (!studentId || !/^\d{10}$/.test(studentId)) return null;
  return 2500 + Number(studentId.slice(0, 2));
}

export function studyYear(entryYearBE: number | null): number | null {
  if (!entryYearBE) return null;
  const now = new Date();
  const thisYearBE = now.getFullYear() + 543;
  const diff = thisYearBE - entryYearBE + (now.getMonth() + 1 >= 8 ? 1 : 0);
  return Math.min(8, Math.max(1, diff));
}

const FACULTY_PREFIXES = ['คณะ', 'วิทยาลัย', 'สถาบัน', 'สำนักวิชา', 'บัณฑิตวิทยาลัย'];

export function inferRole(v: TuVerifyResponse): 'student' | 'instructor' | 'staff' {
  if (v.type === 'student') return 'student';
  const org = `${v.organization ?? ''} ${v.faculty ?? ''}`.trim();
  return FACULTY_PREFIXES.some((p) => org.startsWith(p)) ? 'instructor' : 'staff';
}

function mockVerify(username: string): TuVerifyResponse {
  const isStaff = username.startsWith('staff');
  const isTeacher = username.startsWith('tutor') || username.startsWith('ajarn');
  return {
    status: true,
    message: 'Success',
    type: isStaff || isTeacher ? 'employee' : 'student',
    username,
    displayname_th: `ทดสอบ ${username}`,
    displayname_en: `Test ${username}`,
    email: `${username}@dome.tu.ac.th`,
    department: isTeacher ? 'ภาควิชาฟิสิกส์' : 'วิศวกรรมคอมพิวเตอร์',
    faculty: isTeacher ? 'คณะวิทยาศาสตร์และเทคโนโลยี' : 'คณะวิศวกรรมศาสตร์',
    organization: isStaff ? 'สำนักงานมหาวิทยาลัย' : 'คณะวิทยาศาสตร์และเทคโนโลยี',
  };
}

export function levelFromDepartment(department?: string | null): string | null {
  const m = department?.match(/ปริญญา(ตรี|โท|เอก)/);
  return m ? m[0] : null;
}

export function majorFromDepartment(department?: string | null): string | null {
  if (!department) return null;
  const cleaned = department
    .replace(/ปริญญา(ตรี|โท|เอก)/, '')
    .replace(/ภาค(ปกติ|พิเศษ|ภาษาอังกฤษ)/, '')
    .replace(/สาขาวิชา/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || department;
}
