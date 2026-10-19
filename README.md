# BackHome TU

คลังชีทสรุปและโซเชียลสำหรับนักศึกษาธรรมศาสตร์ (CS261 Group 4, Sec 650001)

- Tech stack: [docs/TECH_STACK.md](docs/TECH_STACK.md)
- API: [docs/API.md](docs/API.md)

## การติดตั้งและเริ่มใช้งาน

1. ติดตั้ง Node.js 22+
2. `npm install`
3. รัน `npm run setup` แล้วใส่รหัสผ่าน (ขอจากหัวหน้ากลุ่มทางแชทส่วนตัว) — ระบบจะสร้าง `.env` จาก `.env.enc` ให้เอง
4. เปิด Supabase SQL Editor แล้วรัน `database/init.sql` (และ `database/fix_profiles.sql`)
5. `npm run dev` แล้วเปิด http://localhost:3000

### รันด้วย Docker
```bash
docker compose up --build
```

## จัดการไฟล์ .env

`.env.enc` คือ `.env` ที่เข้ารหัสด้วย AES-256-GCM — commit ขึ้น git ได้ ส่วน `.env` ห้าม commit

```bash
npm run setup        # ใส่รหัสผ่าน → สร้าง .env
npm run env:encrypt  # หลังแก้ .env → อัปเดต .env.enc แล้ว commit
```
