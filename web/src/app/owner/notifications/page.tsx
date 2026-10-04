import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NotificationsList } from '@/components/NotificationsList';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

 
async function getNotifications(token: string) {
  try {
    const res = await fetch(`${API_URL}/notifications?limit=100`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function OwnerNotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/login');

  const items = await getNotifications(token);

  return (
    <div>
      <h1 className="text-3xl font-black text-gray-900 mb-8">
        Notifications
      </h1>
      <NotificationsList initial={items} />
    </div>
  );
}