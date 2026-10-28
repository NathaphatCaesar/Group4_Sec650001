import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BACKHOME TU',
    short_name: 'BACKHOME',
    description: 'ฟีดรวมของนักศึกษา อาจารย์ และเจ้าหน้าที่ มหาวิทยาลัยธรรมศาสตร์',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f0960f',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
