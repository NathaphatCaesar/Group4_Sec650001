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

const tty = process.stdout.isTTY;
const color = tty && !process.env.NO_COLOR;
const esc = (code) => (s) => (color ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const rgb = (r, g, b) => esc(`38;2;${r};${g};${b}`);
export const c = {
  orange: rgb(249, 115, 22),
  amber: rgb(251, 191, 36),
  pink: rgb(236, 72, 153),
  green: rgb(52, 211, 153),
  red: rgb(248, 113, 113),
  sky: rgb(56, 189, 248),
  gray: rgb(140, 132, 125),
  dim: esc('2'),
  bold: esc('1'),
  tag: esc('48;2;249;115;22;38;2;255;255;255;1'),
  sel: esc('48;2;70;38;20;38;2;255;237;213'),
};

const STOPS = [[251, 191, 36], [249, 115, 22], [236, 72, 153]];
export function gradient(text) {
  if (!color) return text;
  const chars = [...text];
  return chars.map((ch, i) => {
    const t = chars.length > 1 ? i / (chars.length - 1) : 0;
    const seg = t < 0.5 ? 0 : 1;
    const k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const [a, b] = [STOPS[seg], STOPS[seg + 1]];
    const m = a.map((v, j) => Math.round(v + (b[j] - v) * k));
    return `\x1b[38;2;${m[0]};${m[1]};${m[2]}m${ch}`;
  }).join('') + '\x1b[0m';
}

const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;
export function width(s) {
  let w = 0;
  for (const ch of String(s).replace(ANSI, '')) {
    const cp = ch.codePointAt(0);
    if (cp === 0x0e31 || (cp >= 0x0e34 && cp <= 0x0e3a) || (cp >= 0x0e47 && cp <= 0x0e4e)) continue;
    if (cp === 0xfe0f || cp === 0x200d) continue;
    w += cp >= 0x1f300 ? 2 : 1;
  }
  return w;
}
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - width(s)));
const W = Math.max(44, Math.min(62, (process.stdout.columns || 80) - 4));

export function box(lines, { title = '', tint = c.orange } = {}) {
  const inner = W - 4;
  const head = title ? `─ ${title} ` : '';
  console.log(`  ${tint('╭' + head)}${tint('─'.repeat(Math.max(0, W - 2 - width(head))) + '╮')}`);
  for (const l of lines) console.log(`  ${tint('│')} ${pad(l, inner)} ${tint('│')}`);
  console.log(`  ${tint('╰' + '─'.repeat(W - 2) + '╯')}`);
}

const LOGO = [
  '█▀▄ ▄▀█ █▀▀ █▄▀ █ █ █▀█ █▀▄▀█ █▀▀   ▀█▀ █ █',
  '█▄█ █▀█ █▄▄ █ █ █▀█ █▄█ █ ▀ █ ██▄    █  █▄█',
];

export function banner(subtitle) {
  if (tty) process.stdout.write('\x1b[2J\x1b[H');
  console.log('');
  for (const l of LOGO) console.log(`   ${c.bold(gradient(l))}`);
  console.log(`   ${c.tag(' SETUP ')} ${c.gray(subtitle)}`);
  console.log('');
}

export function stepper(steps, current) {
  const parts = steps.map((s, i) => {
    if (i < current) return c.green(`✔ ${s}`);
    if (i === current) return c.bold(c.orange(`${'①②③④⑤'[i]} ${s}`));
    return c.gray(`${'①②③④⑤'[i]} ${s}`);
  });
  console.log(`  ${parts.join(c.gray('  ──  '))}`);
  console.log('');
}

export const step = (s) => console.log(`  ${c.orange('◆')} ${c.bold(s)}`);
export const ok = (s) => console.log(`  ${c.green('✔')} ${s}`);
export const fail = (s) => console.log(`  ${c.red('✖')} ${c.red(s)}`);
export const hint = (s) => console.log(`    ${c.gray(s)}`);

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
    let drawn = false;
    const render = () => {
      const len = [...value].length;
      const shown = len === 0 ? c.gray('พิมพ์รหัสผ่านแล้วกด Enter') : show ? c.amber(value) : c.orange('•'.repeat(len));
      const eye = show ? c.sky('Tab ซ่อนรหัส') : c.gray('Tab ดูรหัส');
      const left = `🔑 ${c.bold(label)}  ${shown}${c.orange('▏')}`;
      const line = pad(left, W - 4 - width(eye)) + eye;
      if (drawn) stdout.write('\x1b[3A');
      drawn = true;
      stdout.write(`\r\x1b[2K  ${c.orange('╭' + '─'.repeat(W - 2) + '╮')}\n`);
      stdout.write(`\r\x1b[2K  ${c.orange('│')} ${line} ${c.orange('│')}\n`);
      stdout.write(`\r\x1b[2K  ${c.orange('╰' + '─'.repeat(W - 2) + '╯')}\n`);
    };
    const onData = (buf) => {
      for (const ch of buf.toString('utf8')) {
        if (ch === '\u0003') { stdout.write('\n'); process.exit(130); }
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          return resolve(value);
        }
        if (ch === '\t') show = !show;
        else if (ch === '\u007f' || ch === '\b') value = [...value].slice(0, -1).join('');
        else if (ch >= ' ') value += ch;
      }
      render();
    };
    render();
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

export function confirm(question, yesLabel, noLabel) {
  const { stdin, stdout } = process;
  if (!stdin.isTTY) return Promise.resolve(false);
  return new Promise((resolve) => {
    step(question);
    console.log(`    ${c.tag(' Enter ')} ${yesLabel}     ${c.gray(`n  ${noLabel}`)}`);
    const onData = (buf) => {
      const s = buf.toString('utf8').toLowerCase();
      if (s === '\u0003') { stdout.write('\n'); process.exit(130); }
      if (s !== '\r' && s !== '\n' && s !== 'y' && s !== 'n' && s !== '\x1b') return;
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off('data', onData);
      console.log('');
      resolve(s !== 'n' && s !== '\x1b');
    };
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}
