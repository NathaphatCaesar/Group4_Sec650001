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

// ถามรหัสผ่านโดยไม่แสดงตัวอักษรบนจอ (ใช้ ENV_PASSWORD แทนได้ เช่นใน CI)
export function askPassword(prompt) {
  if (process.env.ENV_PASSWORD) return Promise.resolve(process.env.ENV_PASSWORD);
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.startsWith(prompt)) rl.output.write(prompt);
      else if (s !== '\r\n' && s !== '\n') rl.output.write('*');
    };
    rl.question(prompt, (answer) => {
      rl.output.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

export function ask(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
