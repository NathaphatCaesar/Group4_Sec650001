// Sprint 3 [Bug] U7: reportPost() ต้องปฏิเสธเหตุผลที่ไม่อยู่ใน REPORT_REASONS ตั้งแต่ชั้นแอป
// เดิมใช้ `reason in REPORT_REASONS` ทำให้ "constructor" / "toString" ผ่าน แล้วไปพังที่ฐานข้อมูลแทน
import { before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

const POST_ID = '11111111-1111-4111-8111-111111111111';
let dbCalls: string[] = [];

function fakeDb() {
  return {
    from(table: string) {
      dbCalls.push(table);
      const builder: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'maybeSingle']) builder[m] = () => builder;
      builder.insert = () => Promise.resolve({ error: null });
      builder.then = (ok: (r: unknown) => unknown) =>
        Promise.resolve({ data: { id: POST_ID, author_id: 'u-author', title: 'ชีท', body: 'สรุป', is_hidden: false }, error: null }).then(ok);
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
