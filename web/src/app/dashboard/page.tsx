import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/login');

  const res = await fetch(`${API_URL}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) redirect('/login');

  const user = await res.json();

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
          <p className="text-sm text-gray-600 mt-1">{user.email}</p>
        </div>
        <LogoutButton />
      </div>
    </main>
  );
}