
import { NotificationsList } from '@/components/NotificationsList';

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-[640px]">
      <h1 className="mb-4 text-xl font-bold">
        การแจ้งเตือน
      </h1>

      <NotificationsList />
    </div>
  );
}
