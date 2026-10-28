
import { NotificationsList } from '@/components/NotificationsList';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const t = await getT();

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <h1 className="mb-4 text-xl font-bold">
        {t('การแจ้งเตือน')}
      </h1>

      <NotificationsList />
    </div>
  );
}
