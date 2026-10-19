// npm run setup หรือ docker compose run --rm setup — ใส่รหัสผ่านเพื่อสร้าง .env จาก .env.enc
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { decrypt, askPassword, choose, banner, step, ok, fail, hint, c, gradient } from './env-crypto.mjs';

const MAX_TRIES = 3;
const PORT = process.env.WEB_PORT || '3000';
const IN_DOCKER = existsSync('/.dockerenv');

banner('ตั้งค่าไฟล์ .env สำหรับเครื่องนี้');

if (!existsSync('.env.enc')) {
  fail('ไม่พบไฟล์ .env.enc');
  hint('ต้องรันในโฟลเดอร์โปรเจกต์ และ pull ล่าสุดก่อน');
  process.exit(1);
}
ok('พบไฟล์ .env.enc');

let needSecret = true;
if (existsSync('.env') && !process.env.ENV_PASSWORD) {
  ok(`มีไฟล์ ${c.bold('.env')} อยู่แล้ว`);
  console.log('');
  const pick = await choose('จะทำอะไรต่อ?', [
    { label: 'ใช้ .env เดิม', hint: 'ไม่ต้องใส่รหัส' },
    { label: 'สร้าง .env ใหม่', hint: 'เขียนทับด้วยข้อมูลจาก .env.enc' },
  ]);
  needSecret = pick === 1;
  console.log('');
}

if (needSecret) {
  const encrypted = readFileSync('.env.enc', 'utf8');
  step('ใส่รหัสผ่านที่ได้จากหัวหน้ากลุ่ม');
  let created = false;
  for (let i = 1; i <= MAX_TRIES && !created; i++) {
    const password = await askPassword('รหัสผ่าน');
    try {
      const plain = decrypt(encrypted, password);
      writeFileSync('.env', plain, { mode: 0o600 });
      const keys = plain.split('\n').filter((l) => /^\s*[A-Z0-9_]+\s*=/.test(l)).length;
      console.log('');
      ok(`สร้าง ${c.bold('.env')} เรียบร้อย ${c.dim(`(${keys} ค่า)`)}`);
      created = true;
    } catch (err) {
      if (process.env.ENV_PASSWORD || i === MAX_TRIES) {
        fail(err.message);
        if (!process.env.ENV_PASSWORD) hint(`ลองครบ ${MAX_TRIES} ครั้งแล้ว — เช็ครหัสกับหัวหน้ากลุ่มอีกที`);
        console.log('');
        process.exit(1);
      }
      fail(`${err.message} ${c.dim(`(เหลืออีก ${MAX_TRIES - i} ครั้ง)`)}`);
    }
  }
  console.log('');
}

// ---------- รันเว็บต่อเลยไหม ----------
if (process.env.ENV_PASSWORD) process.exit(0);

const hasDocker = spawnSync('docker', ['compose', 'version'], { stdio: 'ignore' }).status === 0;
const options = [];
if (hasDocker) options.push({ key: 'docker', label: '🚀 เปิดเว็บด้วย Docker', hint: 'docker compose up --build' });
if (!IN_DOCKER) options.push({ key: 'dev', label: '⚡ เปิดโหมดพัฒนา', hint: 'npm run dev' });
options.push({ key: 'later', label: '👋 ไว้ทีหลัง', hint: 'ออกจากโปรแกรม' });

const pick = options[await choose('จะเปิดเว็บต่อเลยไหม?', options)].key;
console.log('');

const url = `http://localhost:${PORT}`;
const openBrowser = () => {
  if (IN_DOCKER) return;
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
};

if (pick === 'later') {
  hint('เปิดเว็บทีหลังด้วย:');
  console.log(`    ${c.amber('docker compose up --build')}   ${c.dim('หรือ')}   ${c.amber('npm run dev')}`);
  console.log('');
  process.exit(0);
}

if (pick === 'docker') {
  step('กำลัง build และเปิดเว็บ… ครั้งแรกอาจใช้เวลา 2–3 นาที');
  console.log('');
  const up = spawnSync('docker', ['compose', 'up', '--build', '-d', 'web'], { stdio: 'inherit' });
  console.log('');
  if (up.status !== 0) {
    fail('เปิดเว็บไม่สำเร็จ — ดู error ด้านบน');
    process.exit(up.status ?? 1);
  }
  ok(`เว็บเปิดแล้วที่ ${c.bold(c.sky(url))}`);
  hint('ดู log: docker compose logs -f web · ปิด: docker compose down');
  console.log(`\n  ${gradient('━━━━━━━━━━━━  พร้อมใช้งาน 🎉  ━━━━━━━━━━━━')}\n`);
  setTimeout(openBrowser, 3000);
  process.exit(0);
}

if (pick === 'dev') {
  ok(`กำลังเปิด ${c.bold(c.sky(url))} ${c.dim('(Ctrl+C เพื่อปิด)')}`);
  console.log('');
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const dev = spawn(npm, ['run', 'dev'], { stdio: 'inherit' });
  setTimeout(openBrowser, 4000);
  dev.on('exit', (code) => process.exit(code ?? 0));
}
