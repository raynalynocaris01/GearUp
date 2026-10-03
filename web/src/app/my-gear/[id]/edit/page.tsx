import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MyGearForm } from '@/components/MyGearForm';
import type { GearItem } from '@gearup/shared';

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

async function getItem(id: string, token: string): Promise<GearItem | null> {
  try {
    const res = await fetch(`${API_URL}/my/gear/${id}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function EditMyGearPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = await getCurrentUser();
  if (!user || !token) redirect('/login');

  const item = await getItem(id, token);
  if (!item) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          Edit gear
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Update the details for "{item.name}".
        </p>
        <MyGearForm mode="edit" initial={item} />
      </div>
    </div>
  );
}