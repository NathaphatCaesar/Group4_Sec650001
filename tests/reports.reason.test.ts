// Sprint 3 [Bug] U7: reportPost() ต้องปฏิเสธเหตุผลที่ไม่อยู่ใน REPORT_REASONS ตั้งแต่ชั้นแอป
// เดิมใช้ `reason in REPORT_REASONS` ทำให้ "constructor" / "toString" ผ่าน แล้วไปพังที่ฐานข้อมูลแทน
import { before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

const POST_ID = '11111111-1111-4111-8111-111111111111';
const LIVE_POST = { id: POST_ID, author_id: 'u-author', title: 'ชีท', body: 'สรุป', is_hidden: false };
let dbCalls: string[] = [];
let postRow: typeof LIVE_POST | null = LIVE_POST;
let postError: { message: string } | null = null;

function fakeDb() {
  return {
    from(table: string) {
      dbCalls.push(table);
      const builder: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'maybeSingle']) builder[m] = () => builder;
      builder.insert = () => {
        dbCalls.push(`${table}.insert`);
        return Promise.resolve({ error: null });
      };
      builder.then = (ok: (r: unknown) => unknown) =>
        Promise.resolve({ data: postError ? null : postRow, error: postError }).then(ok);
      return builder;
    },
  };
}

mock.module('@/lib/data', { namedExports: { getMe: async () => ({ id: 'u-reporter', role: 'student' }) } });
mock.module('@/lib/supabase', { namedExports: { db: fakeDb } });
mock.module('@/lib/notifications', { namedExports: { notifyManySafely: async () => {} } });
mock.module('next/cache', { namedExports: { revalidatePath: () => {} } });

let reportPost: typeof import('@/actions/reports').reportPost;
before(async () => {
  ({ reportPost } = await import('@/actions/reports'));
});

beforeEach(() => {
  dbCalls = [];
  postRow = LIVE_POST;
  postError = null;
});

const NO_REASON = { ok: false, error: 'กรุณาเลือกเหตุผลก่อนส่งรายงาน' };

describe('reportPost — ตรวจเหตุผลการรายงาน (Sprint 3 Bug U7)', () => {
  it('TC-BUG-U7-01 เหตุผลเป็นชื่อ property ของ Object (constructor, toString, __proto__, hasOwnProperty) → ปฏิเสธด้วย "กรุณาเลือกเหตุผลก่อนส่งรายงาน" และไม่เรียกฐานข้อมูล', async () => {
    for (const reason of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
      assert.deepEqual(await reportPost(POST_ID, reason), NO_REASON, reason);
    }
    assert.deepEqual(dbCalls, []);
  });

  it('TC-BUG-U7-02 ไม่เลือกเหตุผล (null / ค่าว่าง) → ปฏิเสธและไม่เรียกฐานข้อมูล', async () => {
    assert.deepEqual(await reportPost(POST_ID, null), NO_REASON);
    assert.deepEqual(await reportPost(POST_ID, ''), NO_REASON);
    assert.deepEqual(dbCalls, []);
  });

  it('TC-BUG-U7-03 เหตุผลที่ไม่มีในระบบ → ปฏิเสธและไม่เรียกฐานข้อมูล', async () => {
    assert.deepEqual(await reportPost(POST_ID, 'hate'), NO_REASON);
    assert.deepEqual(dbCalls, []);
  });

  it('TC-BUG-U7-04 เหตุผลที่ถูกต้องทั้ง 5 แบบ → ส่งรายงานสำเร็จ', async () => {
    for (const reason of ['inappropriate', 'spam', 'wrong_info', 'copyright', 'privacy']) {
      assert.deepEqual(await reportPost(POST_ID, reason), { ok: true }, reason);
    }
    assert.ok(dbCalls.includes('reports'));
  });
});

// U7 Test case 3: ผู้ใช้กดรายงานโพสต์ที่ถูกลบไปแล้ว → ระบบไม่เด้ง error หลังบ้าน แต่แจ้งว่าไม่พบเนื้อหาที่จะรายงาน
const GONE = { ok: false, error: 'ไม่พบเนื้อหาที่จะรายงาน', gone: true };

describe('reportPost — รายงานโพสต์ที่ถูกลบไปแล้ว (U7 Test case 3)', () => {
  it('TC-U7-03-01 โพสต์ถูกลบออกจากฐานข้อมูลแล้ว → แจ้ง "ไม่พบเนื้อหาที่จะรายงาน" (gone) และไม่บันทึกรายงาน', async () => {
    postRow = null;
    assert.deepEqual(await reportPost(POST_ID, 'spam'), GONE);
    assert.ok(!dbCalls.includes('reports.insert'));
  });

  it('TC-U7-03-02 โพสต์ถูกแอดมินซ่อนไปแล้ว → แจ้ง "ไม่พบเนื้อหาที่จะรายงาน" และไม่บันทึกรายงาน', async () => {
    postRow = { ...LIVE_POST, is_hidden: true };
    assert.deepEqual(await reportPost(POST_ID, 'spam'), GONE);
    assert.ok(!dbCalls.includes('reports.insert'));
  });

  it('TC-U7-03-03 รหัสโพสต์ว่างหรือไม่ใช่ UUID (หน้าเว็บค้างข้อมูลเก่า) → แจ้ง "ไม่พบเนื้อหาที่จะรายงาน" โดยไม่ query ฐานข้อมูล', async () => {
    for (const id of ['', 'not-a-uuid', '1234']) {
      assert.deepEqual(await reportPost(id, 'spam'), GONE, `id=${JSON.stringify(id)}`);
    }
    assert.deepEqual(dbCalls, []);
  });

  it('TC-U7-03-04 ฐานข้อมูลผิดพลาดตอนค้นโพสต์ → คืนข้อความ "ส่งรายงานไม่สำเร็จ ลองใหม่อีกครั้ง" ไม่ throw error', async () => {
    postError = { message: 'connection lost' };
    assert.deepEqual(await reportPost(POST_ID, 'spam'), { ok: false, error: 'ส่งรายงานไม่สำเร็จ ลองใหม่อีกครั้ง' });
  });
});
