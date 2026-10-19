import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { encrypt, decrypt, askPassword, banner, box, fail, hint, c } from './env-crypto.mjs';

banner('เข้ารหัส .env เป็น .env.enc');

if (!existsSync('.env')) {
  fail('ไม่พบไฟล์ .env');
  process.exit(1);
}

hint('ตั้งรหัสผ่านอย่างน้อย 12 ตัว');
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
box([`commit ไฟล์ ${c.bold('.env.enc')} ได้เลย`, c.gray('รหัสผ่านให้ส่งเพื่อนทางแชทส่วนตัว')], { title: c.green('✔ สร้าง .env.enc แล้ว'), tint: c.green });
console.log('');
