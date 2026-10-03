'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';

type IconName =
  | 'dashboard'
  | 'bookings'
  | 'campsites'
  | 'gear'
  | 'events'
  | 'reviews'
  | 'settings'
  | 'bell'
  | 'logout'
  | 'arrowLeft';

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: '/owner', label: 'Dashboard', icon: 'dashboard', exact: true },
  { href: '/owner/bookings', label: 'Bookings', icon: 'bookings' },
  { href: '/owner/campsites', label: 'Campsites', icon: 'campsites' },
  { href: '/owner/gear', label: 'Gear', icon: 'gear' },
  { href: '/owner/events', label: 'Events', icon: 'events' },
  { href: '/owner/reviews', label: 'Reviews', icon: 'reviews' },
  { href: '/owner/settings', label: 'Settings', icon: 'settings' },
];

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const paths: Record<IconName, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </>
    ),
    bookings: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    campsites: (
      <>
        <path d="M3 20l9-16 9 16" />
        <path d="M12 4v4" />
        <path d="M12 12v8" />
        <path d="M9 20l3-4 3 4" />
      </>
    ),
    gear: (
      <>
        <path d="M6 8V6a4 4 0 1 1 8 0v2" />
        <rect x="4" y="8" width="12" height="12" rx="2" />
      </>
    ),
    events: (
      <>
        <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14.2l-4.8 2.4.9-5.3L4.3 7.6l5.3-.8L12 2z" />
      </>
    ),
    reviews: (
      <>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    arrowLeft: (
      <>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

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
              <span className="shrink-0">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: notification + user + logout + back link */}
      <div className="border-t border-gray-100 pb-20 lg:pb-24">
        {/* Notification bell */}
        <button
          type="button"
          className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
        >
          <Icon name="bell" />
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
          className="w-full text-left px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50 border-t border-gray-100 flex items-center gap-3"
        >
          <Icon name="logout" />
          <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
        </button>

        {/* Back to GearUp */}
        <div className="px-5 py-4 border-t border-gray-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gearup-600"
          >
            <Icon name="arrowLeft" size={14} />
            <span>Back to GearUp</span>
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