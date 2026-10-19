# BackHome TU

คลังชีทสรุปและโซเชียลสำหรับนักศึกษาธรรมศาสตร์ (CS261 Group 4, Sec 650001)

- Tech stack: [docs/TECH_STACK.md](docs/TECH_STACK.md)
- API: [docs/API.md](docs/API.md)

## การติดตั้งและเริ่มใช้งาน

1. ติดตั้ง Node.js 22+
2. `npm install`
3. คัดลอก `.env.example` เป็น `.env` แล้วกรอก `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TU_API_KEY`
4. เปิด Supabase SQL Editor แล้วรัน `database/init.sql` (และ `database/fix_profiles.sql`)
5. `npm run dev` แล้วเปิด http://localhost:3000

### รันด้วย Docker
```bash
docker compose up --build
```
