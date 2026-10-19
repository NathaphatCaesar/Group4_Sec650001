# Technology Stack Decision — BackHome TU

| ส่วน | เทคโนโลยี | เหตุผลที่เลือก |
|---|---|---|
| Frontend + Backend | **Next.js 15 (App Router) + React 19 + TypeScript** | เขียนหน้าเว็บและ API (Route Handlers / Server Actions) ในโปรเจกต์เดียว, type-safe, SSR เร็ว |
| Styling | **Tailwind CSS 4** + lucide-react | ทำ UI responsive ได้เร็ว, ธีมมืด/สว่าง + accent color |
| Database | **Supabase (PostgreSQL)** | ฐานข้อมูล relational + index, ใช้ service-role key ฝั่ง server เท่านั้น |
| File Storage | **Supabase Storage** (bucket ไฟล์ชีท) | เก็บ PDF/DOCX/PPTX/ZIP/รูป และได้ public URL ทันที |
| Authentication | **TU REST API** (`/auth/Ad/verify`, `/profile/std/info`) + session cookie ของระบบเอง | ยืนยันว่าเป็นนักศึกษา มธ. จริง, session เก็บในตาราง `sessions` |
| Deployment | **Docker** (multi-stage, Node 22 alpine) + docker-compose | รันเหมือนกันทุกเครื่อง |

## สถาปัตยกรรม

```
Browser ──► Next.js (UI + /api/* + Server Actions) ──► TU REST API (login)
                         │
                         ├──► Supabase Postgres (profiles, sessions, posts, files, follows, ...)
                         └──► Supabase Storage (ไฟล์ชีทสรุป/รูป)
```

- `src/app` หน้าเว็บ (Feed, Profile, Settings, Login) และ API routes
- `src/actions` Server Actions (สร้าง/ลบโพสต์, ตั้งค่า)
- `src/lib` auth, session, TU API client, Supabase client, i18n
- `database/` SQL สร้างตาราง
