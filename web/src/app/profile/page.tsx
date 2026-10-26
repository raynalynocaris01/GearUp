import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { appImageSrc } from '@/components/AppImage';
import { AvatarUploader } from '@/components/AvatarUploader';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'owner' | 'guide' | 'admin';
  is_approved?: boolean;
  avatar_url?: string | null;
}

async function getCurrentUser(): Promise<User | null> {
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

interface Row {
  href: string;
  label: string;
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isCustomer = user.role === 'customer';
  const isOwner = user.role === 'owner';
  const isGuide = user.role === 'guide';
  const isAdmin = user.role === 'admin';

  const accountRows: Row[] = [];
  if (isCustomer || isGuide) {
    accountRows.push({ href: '/my-gear', label: 'My gear listings' });
    accountRows.push({ href: '/my-gear/bookings', label: 'My gear rentals' });
  }
  if (isOwner) {
    accountRows.push({ href: '/owner/settings', label: 'Business settings' });
  }
  if (isGuide) {
    accountRows.push({ href: '/guide/profile', label: 'Guide profile' });
  }
  accountRows.push({ href: '/bookings', label: 'My bookings' });
  accountRows.push({ href: '/profile/change-password', label: 'Change password' });

  const aboutRows: Row[] = [
    { href: '/terms', label: 'Terms of service' },
    { href: '/privacy', label: 'Privacy policy' },
  ];

  const initial = user.name.charAt(0).toUpperCase();
  const roleLabel =
    user.role === 'guide' && !user.is_approved
      ? 'Guide · Pending'
      : user.role === 'guide'
        ? 'Guide · Verified'
        : isOwner
          ? 'Owner'
          : isAdmin
            ? 'Admin'
            : 'Customer';

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar user={user} />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-24 h-24 rounded-full bg-gearup-600 text-white flex items-center justify-center text-4xl font-black overflow-hidden shadow-md">
          <AvatarUploader currentAvatarUrl={user.avatar_url || null} userName={user.name} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            <span className="inline-block mt-2 text-xs font-bold tracking-wider bg-gearup-100 text-gearup-700 px-3 py-1 rounded-full">
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Role dashboard quick link */}
        {isOwner && user.is_approved && (
          <Link
            href="/owner"
            className="flex items-center justify-between bg-gearup-600 hover:bg-gearup-700 text-white font-bold px-5 py-4 rounded-xl mb-4 transition"
          >
            <span>Manage my business</span>
            <span>›</span>
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-between bg-gearup-600 hover:bg-gearup-700 text-white font-bold px-5 py-4 rounded-xl mb-4 transition"
          >
            <span>Admin panel</span>
            <span>›</span>
          </Link>
        )}
        {isGuide && (
          <Link
            href="/guide"
            className="flex items-center justify-between bg-gearup-600 hover:bg-gearup-700 text-white font-bold px-5 py-4 rounded-xl mb-4 transition"
          >
            <span>{user.is_approved ? 'Guide dashboard' : 'Guide application pending'}</span>
            <span>›</span>
          </Link>
        )}

        {/* Account section */}
        <Section title="Account" rows={accountRows} />


        {/* About section */}
        <Section title="About" rows={aboutRows} />

        <p className="text-center text-xs text-gray-400 mt-8">GearUp v1.0</p>
      </div>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <>
      <h2 className="text-xs font-black tracking-wider text-gray-500 uppercase mt-6 mb-2 ml-1">
        {title}
      </h2>
      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        {rows.map((row, i) => (
          <Link
            key={row.href}
            href={row.href}
            className={`flex items-center justify-between px-5 py-4 hover:bg-slate-100 transition ${
              i < rows.length - 1 ? 'border-b border-slate-200' : ''
            }`}
          >
            <span className="text-sm font-semibold text-gray-900">
              {row.label}
            </span>
            <span className="text-gray-400">›</span>
          </Link>
        ))}
      </div>
    </>
  );
}
