import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MyGearForm } from '@/components/MyGearForm';

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

export default async function NewMyGearPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          Add gear
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          List an item you want to rent out to campers.
        </p>
        <MyGearForm mode="create" />
      </div>
    </div>
  );
}