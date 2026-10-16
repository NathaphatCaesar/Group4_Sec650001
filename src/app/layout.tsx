import type { Metadata, Viewport } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/client';
import { getLocale } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'BACKHOME TU — เรียนด้วยกัน ไปได้ไกลกว่า',
  description: 'ฟีดรวมของนักศึกษา อาจารย์ และเจ้าหน้าที่ มหาวิทยาลัยธรรมศาสตร์ — ชีท ติว ถาม-ตอบ ประกาศ ในที่เดียว',
  applicationName: 'BACKHOME TU',
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#f0960f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('bh.theme')||'system';
if(t!=='system')document.documentElement.setAttribute('data-theme',t);
var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
