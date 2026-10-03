'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: '/owner', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/owner/bookings', label: 'Bookings', icon: '📅' },
  { href: '/owner/campsites', label: 'Campsites', icon: '⛺' },
  { href: '/owner/gear', label: 'Gear', icon: '🎒' },
  { href: '/owner/events', label: 'Events', icon: '🎉' },
  { href: '/owner/reviews', label: 'Reviews', icon: '⭐' },
  { href: '/owner/settings', label: 'Settings', icon: '⚙️' },
];

interface Props {
  ownerName?: string;
  ownerEmail?: string;
  campName?: string;
}

export function OwnerSidebar({
  ownerName = 'Owner',
  ownerEmail = '',
  campName,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const initial = ownerName.charAt(0).toUpperCase();

  const content = (
    <>
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-5 border-b border-gray-100"
      >
        <Image
          src="/logo.png"
          alt="GearUp"
          width={32}
          height={32}
          style={{ width: 'auto', height: 'auto' }}
        />
        <span className="text-lg font-black tracking-tight">
          <span className="text-gray-900">Gear</span>
          <span className="text-gearup-600">Up</span>
        </span>
      </Link>

      {/* Owner context */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-500 font-medium">
          {campName ?? 'Owner Dashboard'}
        </p>
        <p className="text-sm font-bold text-gray-900 mt-0.5">
          {ownerName}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold transition border-l-4 ${
                active
                  ? 'bg-gearup-50 text-gearup-700 border-gearup-600'
                  : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: notification + user + logout + back link */}
      <div className="border-t border-gray-100">
        {/* Notification bell */}
        <button
          type="button"
          className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
        >
          <span className="text-lg">🔔</span>
          <span>Notifications</span>
          <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-600 rounded-full">
            0
          </span>
        </button>

        {/* User block */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gearup-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {ownerName}
            </p>
            {ownerEmail && (
              <p className="text-xs text-gray-500 truncate">
                {ownerEmail}
              </p>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-left px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50 border-t border-gray-100"
        >
          {loggingOut ? 'Logging out…' : '→ Log out'}
        </button>

        {/* Back to GearUp */}
        <div className="px-5 py-4 border-t border-gray-100">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gearup-600"
          >
            ← Back to GearUp
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar: logo left, hamburger center, avatar right */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="GearUp"
            width={28}
            height={28}
            style={{ width: 'auto', height: 'auto' }}
          />
          <span className="text-base font-black tracking-tight">
            <span className="text-gray-900">Gear</span>
            <span className="text-gearup-600">Up</span>
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(true)}
          className="p-2"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="w-9 h-9 rounded-full bg-gearup-600 text-white flex items-center justify-center font-bold text-sm">
          {initial}
        </div>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0">
        {content}
      </aside>
    </>
  );
}