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

## Server Actions (`src/actions/posts.ts`)
- `createPost(input)` — สร้างโพสต์; แท็ก `#ชีท` ต้องมีชื่อ + ไฟล์ ≥ 1 แล้วได้ +10 ดาว → `{ ok, id, starsAwarded }`
- `deletePost(postId)` — ลบได้เฉพาะเจ้าของหรือ admin

## Data (`src/lib/data.ts`)
- `getFeed({ tag, subject, faculty, group, sort: 'new'|'top', offset, limit })` — ไม่รวมโพสต์ที่ถูกซ่อน, เห็นเฉพาะ public หรือของตัวเอง
- `getUserProfileAndPosts(username)` — โปรไฟล์ + โพสต์ + ชีท + จำนวนผู้ติดตาม
