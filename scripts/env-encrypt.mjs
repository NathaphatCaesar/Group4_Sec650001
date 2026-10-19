// npm run env:encrypt — เข้ารหัส .env เป็น .env.enc (commit .env.enc ได้)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { encrypt, decrypt, askPassword } from './env-crypto.mjs';

if (!existsSync('.env')) {
  console.error('ไม่พบไฟล์ .env');
  process.exit(1);
}

const password = await askPassword('ตั้งรหัสผ่าน: ');
if (password.length < 12) {
  console.error('รหัสผ่านต้องยาวอย่างน้อย 12 ตัว');
  process.exit(1);
}
if (!process.env.ENV_PASSWORD) {
  const again = await askPassword('ยืนยันรหัสผ่าน: ');
  if (again !== password) {
    console.error('รหัสผ่านไม่ตรงกัน');
    process.exit(1);
  }
}

const plain = readFileSync('.env', 'utf8');
const out = encrypt(plain, password);
if (decrypt(out, password) !== plain) throw new Error('ตรวจสอบการเข้ารหัสไม่ผ่าน');
writeFileSync('.env.enc', out);
console.log('สร้าง .env.enc แล้ว — commit ไฟล์นี้ได้ ส่วนรหัสผ่านให้ส่งทางแชทส่วนตัว');
