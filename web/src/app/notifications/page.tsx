import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { NotificationsList } from '@/components/NotificationsList';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

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

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = await getCurrentUser();
  if (!user || !token) redirect('/login');

  const items = await getNotifications(token);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black text-gray-900 mb-8">
          Notifications
        </h1>
        <NotificationsList initial={items} />
      </div>
    </div>
  );
}