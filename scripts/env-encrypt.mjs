// npm run env:encrypt — เข้ารหัส .env เป็น .env.enc (commit .env.enc ได้)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { encrypt, decrypt, askPassword, banner, step, ok, fail, hint } from './env-crypto.mjs';

banner('เข้ารหัส .env เป็น .env.enc');

if (!existsSync('.env')) {
  fail('ไม่พบไฟล์ .env');
  process.exit(1);
}

step('ตั้งรหัสผ่าน (อย่างน้อย 12 ตัว)');
const password = await askPassword('รหัสผ่าน');
if (password.length < 12) {
  fail('รหัสผ่านต้องยาวอย่างน้อย 12 ตัว');
  process.exit(1);
}
if (!process.env.ENV_PASSWORD) {
  const again = await askPassword('ยืนยันรหัส');
  if (again !== password) {
    fail('รหัสผ่านไม่ตรงกัน');
    process.exit(1);
  }
}

const plain = readFileSync('.env', 'utf8');
const out = encrypt(plain, password);
if (decrypt(out, password) !== plain) throw new Error('ตรวจสอบการเข้ารหัสไม่ผ่าน');
writeFileSync('.env.enc', out);
console.log('');
ok('สร้าง .env.enc แล้ว — commit ไฟล์นี้ได้');
hint('รหัสผ่านให้ส่งเพื่อนทางแชทส่วนตัว อย่าใส่ใน repo');
console.log('');
