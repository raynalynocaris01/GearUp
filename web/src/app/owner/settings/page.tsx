import { cookies } from 'next/headers';
import { OwnerSettingsClient } from '@/components/owner/OwnerSettingsClient';

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

export default async function OwnerSettingsPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-500 text-sm mb-8">
        Manage your account and business preferences.
      </p>

      <OwnerSettingsClient
        initialName={user?.name ?? ''}
        initialEmail={user?.email ?? ''}
      />
    </div>
  );
}