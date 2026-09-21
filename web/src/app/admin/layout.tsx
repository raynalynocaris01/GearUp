import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AdminTabs } from '@/components/admin/AdminTabs';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <AdminTabs />
      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}