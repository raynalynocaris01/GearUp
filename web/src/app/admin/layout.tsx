import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

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

async function getAdminStats(token: string) {
  try {
    const res = await fetch(`${API_URL}/admin/dashboard`, {
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
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = await getCurrentUser();

  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/');

  const stats = token ? await getAdminStats(token) : null;
  const pendingCount = stats?.pending_owners ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar
        adminName={user.name ?? 'Admin'}
        adminEmail={user.email ?? ''}
        pendingCount={pendingCount}
      />
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}