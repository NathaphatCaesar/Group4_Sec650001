import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { decrypt, askPassword, confirm, banner, stepper, box, ok, fail, hint, c } from './env-crypto.mjs';

const MAX_TRIES = 3;
const PORT = process.env.WEB_PORT || '3000';
const URL = `http://localhost:${PORT}`;
const IN_DOCKER = existsSync('/.dockerenv');
const STEPS = ['ใส่รหัส', 'สร้าง .env', 'เปิดเว็บ'];

banner('ตั้งค่าเครื่องนี้ให้พร้อมรันเว็บ');

if (!existsSync('.env.enc')) {
  box([c.red('ไม่พบไฟล์ .env.enc'), c.gray('รันในโฟลเดอร์โปรเจกต์ และ git pull ล่าสุดก่อน')], { title: c.red('✖ เริ่มไม่ได้'), tint: c.red });
  console.log('');
  process.exit(1);
}

if (existsSync('.env') && !process.env.ENV_PASSWORD) {
  stepper(STEPS, 2);
  ok(`เครื่องนี้มี ${c.bold('.env')} แล้ว ไม่ต้องใส่รหัส`);
  hint('ถ้าอยากใส่รหัสใหม่ ให้ลบไฟล์ .env แล้วรันคำสั่งนี้อีกครั้ง');
  console.log('');
} else {
  stepper(STEPS, 0);
  const encrypted = readFileSync('.env.enc', 'utf8');
  for (let i = 1; ; i++) {
    const password = await askPassword('รหัสผ่าน');
    try {
      const plain = decrypt(encrypted, password);
      writeFileSync('.env', plain, { mode: 0o600 });
      console.log('');
      stepper(STEPS, 2);
      ok(`สร้าง ${c.bold('.env')} เรียบร้อย`);
      console.log('');
      break;
    } catch (err) {
      if (process.env.ENV_PASSWORD || i >= MAX_TRIES) {
        console.log('');
        box([c.red(err.message), c.gray('เช็ครหัสกับหัวหน้ากลุ่มอีกที แล้วรันใหม่')], { title: c.red('✖ ไม่สำเร็จ'), tint: c.red });
        console.log('');
        process.exit(1);
      }
      fail(`${err.message} — ลองอีกครั้ง ${c.gray(`(เหลือ ${MAX_TRIES - i} ครั้ง)`)}`);
      console.log('');
    }
  }
}

if (process.env.ENV_PASSWORD) process.exit(0);

const hasDocker = spawnSync('docker', ['compose', 'version'], { stdio: 'ignore' }).status === 0;
const mode = hasDocker ? 'docker' : IN_DOCKER ? null : 'dev';

const later = () => {
  box([
    `เปิดเว็บทีหลังด้วย  ${c.amber('docker compose up --build')}`,
    hasDocker ? '' : `หรือ  ${c.amber('npm run dev')}`,
  ].filter(Boolean), { title: c.green('✔ ตั้งค่าเสร็จแล้ว'), tint: c.green });
  console.log('');
  process.exit(0);
};

if (!mode) later();
const go = await confirm('เปิดเว็บเลยไหม?', 'เปิดเว็บ', 'ไว้ทีหลัง');
if (!go) later();

const openBrowser = () => {
  if (IN_DOCKER) return;
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', URL] : [URL];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
};

if (mode === 'docker') {
  hint('กำลังเปิดเว็บ… ครั้งแรกอาจใช้เวลา 2–3 นาที');
  console.log('');
  const owner = spawnSync('docker', ['inspect', 'backhome-web', '--format', '{{index .Config.Labels "com.docker.compose.project"}}'], { encoding: 'utf8' });
  if (owner.status === 0 && owner.stdout.trim() !== 'backhome') {
    spawnSync('docker', ['rm', '-f', 'backhome-web'], { stdio: 'ignore' });
  }
  const up = spawnSync('docker', ['compose', 'up', '--build', '-d', 'web'], { stdio: 'inherit' });
  console.log('');
  if (up.status !== 0) {
    box([c.red('เปิดเว็บไม่สำเร็จ'), c.gray('ดูข้อความ error ด้านบน')], { title: c.red('✖ ไม่สำเร็จ'), tint: c.red });
    console.log('');
    process.exit(up.status ?? 1);
  }
  box([
    `เปิดเว็บที่    ${c.bold(c.sky(URL))}`,
    '',
    `ดู log       ${c.amber('docker compose logs -f web')}`,
    `ปิดเว็บ       ${c.amber('docker compose down')}`,
  ], { title: c.green('✔ พร้อมใช้งาน 🎉'), tint: c.green });
  console.log('');
  setTimeout(() => { openBrowser(); process.exit(0); }, 2000);
}

if (mode === 'dev') {
  ok(`กำลังเปิด ${c.bold(c.sky(URL))} ${c.gray('(Ctrl+C เพื่อปิด)')}`);
  console.log('');
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const dev = spawn(npm, ['run', 'dev'], { stdio: 'inherit' });
  setTimeout(openBrowser, 4000);
  dev.on('exit', (code) => process.exit(code ?? 0));
}
