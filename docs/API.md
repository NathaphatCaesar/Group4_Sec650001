# API Documentation — BackHome TU

ทุก endpoint ตอบเป็น JSON; error มีรูปแบบ `{ "error": "<ข้อความ>" }`
การยืนยันตัวตนใช้ cookie session ที่ได้จาก `/api/auth/login`

## POST /api/auth/login
Body: `{ "username": "6xxxxxxxxx", "password": "..." }`
| Status | ความหมาย |
|---|---|
| 200 | `{ "ok": true }` + ตั้ง cookie session |
| 400 | ไม่กรอก/รูปแบบไม่ถูกต้อง/ยาวเกิน |
| 401 ฯลฯ | TU API ปฏิเสธ (username/password ผิด) |
| 429 | ล็อกอินเกิน 8 ครั้ง / 10 นาที |
| 502 | ฐานข้อมูลมีปัญหา |

## POST /api/auth/logout
ลบ session และ cookie

## POST /api/upload
`multipart/form-data`: `file` (required), `kind` = `file` | `image`
| Status | ความหมาย |
|---|---|
| 201 | `{ id, file_name, mime_type, size_bytes, kind, url }` |
| 400 | ไม่ได้แนบไฟล์ |
| 401 / 403 | ยังไม่ล็อกอิน / บัญชีถูกระงับ |
| 413 | ไฟล์ใหญ่เกิน (ไฟล์ 50 MB, รูป 10 MB) |
| 415 | ประเภทไฟล์ไม่รองรับ (เช่น .mp4) |
| 429 | อัปโหลดเกิน 25 ครั้ง/นาที |
| 500 | บันทึกไม่สำเร็จ (ลบไฟล์ออกจาก Storage อัตโนมัติ — rollback) |

## GET /api/files/{id}/download[?download=1]
302 redirect ไปยัง public URL ของไฟล์; `?download=1` เพิ่ม `download_count` · 404 เมื่อไม่พบไฟล์

## POST /api/follow · DELETE /api/follow
Body: `{ "targetUserId": "<uuid>" }` → `{ "ok": true, "following": boolean }` · 400 เมื่อไม่ระบุผู้ใช้

## POST /api/bookmarks · DELETE /api/bookmarks
Body: `{ "postId": "<uuid>" }` → `{ "ok": true, "bookmarked": boolean }`
| Status | ความหมาย |
|---|---|
| 200 | บันทึก (POST) / ยกเลิกบันทึก (DELETE) สำเร็จ; บันทึกซ้ำไม่เกิดแถวซ้ำ |
| 400 | ไม่ระบุโพสต์ หรือรหัสโพสต์ไม่ถูกต้อง |
| 401 | ยังไม่ล็อกอิน |
| 404 | (POST) ไม่พบโพสต์ หรือโพสต์ถูกซ่อน/ไม่ใช่ public |
| 502 | ฐานข้อมูลมีปัญหา |

## Server Actions (`src/actions/posts.ts`)
- `createPost(input)` — สร้างโพสต์; แท็ก `#ชีท` ต้องมีชื่อ + ไฟล์ ≥ 1 แล้วได้ +10 ดาว → `{ ok, id, starsAwarded }`
- `deletePost(postId)` — ลบได้เฉพาะเจ้าของหรือ admin

## Server Actions (`src/actions/reports.ts`) — U7/U8
- `reportPost(postId, reason, detail?)` — รายงานโพสต์; `reason` ต้องเป็น `wrong_info` | `copyright` | `spam` | `inappropriate` | `privacy` ไม่งั้นปฏิเสธพร้อมข้อความให้เลือกเหตุผล · โพสต์ที่ถูกลบ/ซ่อนแล้วตอบ `{ ok: false, gone: true, error: 'ไม่พบเนื้อหาที่จะรายงาน' }` · รายงานซ้ำระหว่างรอตรวจถือว่าสำเร็จ · รายงานโพสต์ตัวเองไม่ได้
- `resolveReport(reportId, action, note?)` — admin เท่านั้น; `hide` ซ่อนโพสต์, `delete` ลบโพสต์ (ทั้งสองแบบเคสเป็น `actioned`), `dismiss` ปิดเคสโดยโพสต์ยังแสดงอยู่ (`dismissed`) · ปิดทุกเคสที่ค้างของโพสต์เดียวกันพร้อมกัน

## Data (`src/lib/data.ts`)
- `getFeed({ tag, subject, faculty, group, scope, sort: 'new'|'top', offset, limit })` — ไม่รวมโพสต์ที่ถูกซ่อน, เห็นเฉพาะ public หรือของตัวเอง; `scope: 'bookmarks'` แสดงเฉพาะโพสต์ที่ผู้ใช้บันทึกไว้ (ยังไม่ล็อกอิน → ว่าง) และทุกโพสต์มี `bookmarked` บอกว่าผู้ใช้บันทึกไว้หรือไม่
- `getUserProfileAndPosts(username)` — โปรไฟล์ + โพสต์ + ชีท + จำนวนผู้ติดตาม
- `getReports('pending' | 'closed')` — คิวรายงานสำหรับหน้า `/admin/reports` (admin เท่านั้น, รวมโพสต์ที่ถูกซ่อน)
- `getPendingReportCount()` — จำนวนรายงานที่รอตรวจ (badge ในเมนูแอดมิน)

## นัดติว (U14) — `/api/study/{id}/…`
`{id}` คือ id ของโพสต์แท็ก `#หาเพื่อนติว` · ต้องล็อกอิน (401) · id ผิดรูปแบบ 400 · เกิน 30 ครั้ง/นาที 429 · ตาราง/ฟังก์ชันยังไม่ได้รัน `database/study_members.sql` → 503
ที่นั่ง = `posts.capacity` (null = ไม่จำกัด, ไม่นับเจ้าของ) นับเฉพาะคนที่ `approved` · ตรวจที่นั่งในฟังก์ชันฐานข้อมูลที่ล็อกแถวโพสต์ จึงไม่เกินแม้กดพร้อมกัน

### POST /api/study/{id}/join — ขอเข้าร่วม
| Status | ความหมาย |
|---|---|
| 201 | `{ ok, status: 'pending' \| 'approved', signup_count, capacity }` — นัดที่ไม่ต้องอนุมัติได้ `approved` ทันที · แจ้งเตือนเจ้าของ `study_signup` |
| 403 | บัญชีถูกระงับ |
| 404 | ไม่พบนัดติว (ไม่ใช่ studybuddy / ถูกซ่อน / ถูกลบ) |
| 409 | ขอซ้ำ · เคยถูกปฏิเสธ · เป็นเจ้าของเอง · นัดจบ/เลยเวลาแล้ว · ที่นั่งเต็มแล้ว |

### DELETE /api/study/{id}/join — ยกเลิกคำขอ / ออกจากนัดติว
200 `{ ok, status: 'none' }` · 404 ไม่มีคำขอที่ยกเลิกได้ (คำขอที่ถูกปฏิเสธยกเลิกเองไม่ได้)

### POST /api/study/{id}/approve · POST /api/study/{id}/reject — เจ้าของนัดติวเท่านั้น
Body: `{ "userId": "<uuid ผู้ขอ>" }`
| Status | ความหมาย |
|---|---|
| 200 | `{ ok, userId, status: 'approved' \| 'rejected', signup_count, capacity }` · แจ้งเตือนผู้ขอ `study_approved` / `study_rejected` |
| 400 | ไม่ระบุ `userId` |
| 403 | ไม่ใช่เจ้าของนัดติว |
| 404 | ไม่พบนัดติว / ไม่พบคำขอ |
| 409 | คำขอไม่ได้อยู่ในสถานะรออนุมัติ · (approve) ที่นั่งเต็มแล้ว หรือนัดจบแล้ว |

### GET /api/study/{id}/members
`{ capacity, requires_approval, signup_count, pending_count, my_status, is_owner }` · เจ้าของได้ `members: [{ user_id, status, created_at, decided_at, user }]` เพิ่ม
