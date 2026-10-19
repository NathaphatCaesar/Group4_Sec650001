// เข้ารหัส/ถอดรหัสไฟล์ .env ด้วย AES-256-GCM (กุญแจได้จากรหัสผ่านผ่าน scrypt)
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';

const MAGIC = 'BHENV1';

function keyFrom(password, salt) {
  return scryptSync(password, salt, 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}

export function encrypt(plain, password) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(password, salt), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${MAGIC}:${Buffer.concat([salt, iv, tag, data]).toString('base64')}\n`;
}

export function decrypt(text, password) {
  const [magic, body] = text.trim().split(':');
  if (magic !== MAGIC || !body) throw new Error('ไฟล์ .env.enc ไม่ถูกต้อง');
  const buf = Buffer.from(body, 'base64');
  const salt = buf.subarray(0, 16);
  const iv = buf.subarray(16, 28);
  const tag = buf.subarray(28, 44);
  const data = buf.subarray(44);
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(password, salt), iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    throw new Error('รหัสผ่านไม่ถูกต้อง');
  }
}

// ---------- หน้าตาใน terminal ----------
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const rgb = (r, g, b) => (s) => (color ? `\x1b[38;2;${r};${g};${b}m${s}\x1b[0m` : String(s));
const bg = (r, g, b) => (s) => (color ? `\x1b[48;2;${r};${g};${b}m\x1b[38;2;255;255;255m${s}\x1b[0m` : String(s));
export const c = {
  orange: rgb(249, 115, 22),
  amber: rgb(251, 191, 36),
  pink: rgb(236, 72, 153),
  green: rgb(52, 211, 153),
  red: rgb(248, 113, 113),
  sky: rgb(56, 189, 248),
  dim: (s) => (color ? `\x1b[2m${s}\x1b[0m` : String(s)),
  bold: (s) => (color ? `\x1b[1m${s}\x1b[0m` : String(s)),
  tag: bg(249, 115, 22),
};

// ไล่สีจากส้ม → ชมพู ทีละตัวอักษร
const STOPS = [[251, 191, 36], [249, 115, 22], [236, 72, 153]];
export function gradient(text) {
  if (!color) return text;
  const chars = [...text];
  return chars.map((ch, i) => {
    const t = chars.length > 1 ? i / (chars.length - 1) : 0;
    const seg = t < 0.5 ? 0 : 1;
    const k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const [a, b] = [STOPS[seg], STOPS[seg + 1]];
    const mix = a.map((v, j) => Math.round(v + (b[j] - v) * k));
    return `\x1b[38;2;${mix[0]};${mix[1]};${mix[2]}m${ch}`;
  }).join('') + '\x1b[0m';
}

const LOGO = [
  '█▀▄ ▄▀█ █▀▀ █▄▀ █ █ █▀█ █▀▄▀█ █▀▀   ▀█▀ █ █',
  '█▄█ █▀█ █▄▄ █ █ █▀█ █▄█ █ ▀ █ ██▄    █  █▄█',
];

export function banner(subtitle) {
  console.log('');
  for (const l of LOGO) console.log(`  ${c.bold(gradient(l))}`);
  console.log(`  ${gradient('━'.repeat(LOGO[0].length))}`);
  console.log(`  ${c.tag(' SETUP ')} ${c.dim(subtitle)}`);
  console.log('');
}

export const step = (s) => console.log(`  ${c.amber('◆')} ${s}`);
export const ok = (s) => console.log(`  ${c.green('✔')} ${s}`);
export const fail = (s) => console.log(`  ${c.red('✖')} ${c.red(s)}`);
export const hint = (s) => console.log(`    ${c.dim(s)}`);

// ถามรหัสผ่าน: แสดงเป็น • กด Tab เพื่อดู/ซ่อนรหัส (ใช้ ENV_PASSWORD แทนได้ เช่นใน CI)
export function askPassword(label) {
  if (process.env.ENV_PASSWORD) return Promise.resolve(process.env.ENV_PASSWORD);
  const { stdin, stdout } = process;
  if (!stdin.isTTY) {
    return new Promise((resolve) => {
      const rl = createInterface({ input: stdin });
      rl.question('', (a) => { rl.close(); resolve(a); });
    });
  }
  return new Promise((resolve) => {
    let value = '';
    let show = false;
    const render = () => {
      const shown = show ? c.amber(value) : c.orange('•'.repeat([...value].length));
      const eye = show ? c.sky('◉ แสดงรหัส') : c.dim('◎ ซ่อนรหัส');
      stdout.write(`\r\x1b[2K  ${c.pink('❯')} ${c.bold(label)} ${shown}${c.dim('▏')}  ${eye}`);
    };
    const done = (result) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off('data', onData);
      stdout.write('\n');
      resolve(result);
    };
    const onData = (buf) => {
      for (const ch of buf.toString('utf8')) {
        if (ch === '\u0003') { stdout.write('\n'); process.exit(130); }      // Ctrl+C
        else if (ch === '\r' || ch === '\n') return done(value);
        else if (ch === '\t') show = !show;
        else if (ch === '\u007f' || ch === '\b') value = [...value].slice(0, -1).join('');
        else if (ch >= ' ') value += ch;
      }
      render();
    };
    hint('Tab ดู/ซ่อนรหัส · Enter ยืนยัน');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
    render();
  });
}

// เมนูเลือกด้วยลูกศร ↑↓ แล้วกด Enter — คืนค่า index ที่เลือก
export function choose(question, options) {
  const { stdin, stdout } = process;
  if (!stdin.isTTY) return Promise.resolve(0);
  return new Promise((resolve) => {
    let idx = 0;
    let drawn = false;
    const render = () => {
      if (drawn) stdout.write(`\x1b[${options.length}A`);
      drawn = true;
      options.forEach((o, i) => {
        const line = i === idx
          ? `  ${c.pink('❯')} ${c.bold(gradient(o.label))}  ${c.dim(o.hint ?? '')}`
          : `    ${c.dim(o.label)}`;
        stdout.write(`\r\x1b[2K${line}\n`);
      });
    };
    const onData = (buf) => {
      const s = buf.toString('utf8');
      if (s === '\u0003') { stdout.write('\x1b[?25h\n'); process.exit(130); }
      if (s === '\x1b[A' || s === 'k') idx = (idx + options.length - 1) % options.length;
      else if (s === '\x1b[B' || s === 'j' || s === '\t') idx = (idx + 1) % options.length;
      else if (s === '\r' || s === '\n') {
        stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData);
        stdout.write('\x1b[?25h');
        return resolve(idx);
      }
      render();
    };
    step(question);
    hint('↑↓ เลือก · Enter ตกลง');
    stdout.write('\x1b[?25l');
    render();
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

export function ask(label) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`  ${c.pink('❯')} ${label} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
