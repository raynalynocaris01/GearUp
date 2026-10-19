import { cookies } from 'next/headers';
import { NotificationsList } from '@/components/NotificationsList';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getNotifications(token: string) {
  const res = await fetch(`${API_URL}/notifications?limit=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return await res.json();
}

export default async function GuideNotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;

  const items = await getNotifications(token);

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">
        Notifications
      </h1>
      <NotificationsList initial={items} />
    </div>
  );
}