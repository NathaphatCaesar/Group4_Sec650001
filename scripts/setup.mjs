// npm run setup — ใส่รหัสผ่านเพื่อสร้าง .env จาก .env.enc
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { decrypt, askPassword, ask } from './env-crypto.mjs';

if (!existsSync('.env.enc')) {
  console.error('ไม่พบไฟล์ .env.enc');
  process.exit(1);
}
if (existsSync('.env') && !process.env.ENV_PASSWORD) {
  const ans = await ask('มีไฟล์ .env อยู่แล้ว เขียนทับไหม? (y/N) ');
  if (ans.toLowerCase() !== 'y') {
    console.log('ยกเลิก — ไม่ได้แก้ .env');
    process.exit(0);
  }
}

const password = await askPassword('รหัสผ่าน: ');
try {
  const plain = decrypt(readFileSync('.env.enc', 'utf8'), password);
  writeFileSync('.env', plain, { mode: 0o600 });
  console.log('สร้าง .env เรียบร้อย — รัน npm run dev หรือ docker compose up --build ได้เลย');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
