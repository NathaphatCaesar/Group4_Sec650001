import { Logo } from '@/components/Logo';
import { LoginForm } from '@/components/LoginForm';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t('เข้าสู่ระบบ')} — BACKHOME TU` };
}

export default async function LoginPage() {
  const t = await getT();

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-gradient-to-br from-brand-100 via-brand-50 to-amber-50 p-12 lg:flex">
        <Logo size={72} />
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            {t('เรียนด้วยกัน')}<br />{t('เติบโตไปด้วยกัน')}<br />
            <span className="text-brand-600">{t('ที่ มธ.')}</span>
          </h1>
          <p className="mt-4 max-w-sm text-ink-soft">
            {t('ฟีดเดียวรวมทุกอย่าง — ชีท ติว ถาม-ตอบ ประกาศ คนโพสต์มีป้าย role จริงจากบัญชีมหาลัย ปลอมไม่ได้')}
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-sm">
            {['#ชีท', '#หาเพื่อนติว', '#ถาม-ตอบ', '#ประกาศ'].map((tag) => (
              <li key={tag} className="rounded-full bg-white/70 px-3.5 py-1.5">{t(tag)}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-ink-soft">
          {t('ระบบนี้ยืนยันตัวตนผ่าน TU API — เราไม่เก็บรหัสผ่านบัญชี มธ. ของคุณ')}
        </p>
      </section>

      <section className="grid place-items-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden"><Logo size={96} /></div>
          <h2 className="text-2xl font-bold">{t('เข้าสู่ระบบ')}</h2>
          <p className="mt-1 text-sm text-ink-soft">{t('ใช้บัญชี มธ. (TU Account) เดียวกับที่ล็อกอิน reg.tu.ac.th')}</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
