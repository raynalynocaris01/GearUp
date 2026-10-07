'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { NotificationBellRow } from '@/components/NotificationBellRow';

type IconName =
  | 'dashboard'
  | 'users'
  | 'campsites'
  | 'bookings'
  | 'reviews'
  | 'events'
  | 'tourGuides'
  | 'logout'
  | 'arrowLeft';

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/campsites', label: 'Campsites', icon: 'campsites' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'bookings' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
  { href: '/admin/events', label: 'Events', icon: 'events' },
  { href: '/admin/tour-guides', label: 'Tour Guides', icon: 'tourGuides' },
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
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
    bookings: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    reviews: (
      <>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </>
    ),
    events: (
      <>
        <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14.2l-4.8 2.4.9-5.3L4.3 7.6l5.3-.8L12 2z" />
      </>
    ),
    tourGuides: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
  adminName?: string;
  adminEmail?: string;
  pendingCount?: number;
}

export function AdminSidebar({
  adminName = 'Admin',
  adminEmail = '',
  pendingCount,
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

  const initial = adminName.charAt(0).toUpperCase();

  const content = (
        <div className="flex flex-col h-full bg-[#183d1d] text-white/90">
      {/* Brand */}
      <Link
        href="/admin"
        className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0"
      >
        <Image
          src="/logo.png"
          alt="GearUp"
          width={28}
          height={28}
          style={{ width: 28, height: 28, objectFit: 'contain' }}
        />
        <div className="leading-tight">
          <p className="text-base font-black tracking-tight text-white">
            GearUp
          </p>
          <p className="text-[10px] uppercase tracking-wider text-white/55 font-bold">
            Admin Panel
          </p>
        </div>
      </Link>

      {/* Nav (scrollable) */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item);
            const showBadge =
              item.href === '/admin/users' &&
              typeof pendingCount === 'number' &&
              pendingCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-white/80" />
                )}
                <span
                  className={`shrink-0 ${
                    active ? 'text-white' : 'text-white/60'
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                </span>
                <span>{item.label}</span>
                {showBadge && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-600 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 shrink-0 pb-8">
        <NotificationBellRow href="/admin/notifications" variant="dark" />

        {/* User block */}
        <div className="px-4 py-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gearup-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {adminName}
            </p>
            {adminEmail && (
              <p className="text-xs text-white/55 truncate">
                {adminEmail}
              </p>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-left px-4 py-2 text-sm font-semibold text-red-200/90 hover:bg-red-500/15 hover:text-red-100 transition disabled:opacity-50 flex items-center gap-3"
        >
          <Icon name="logout" size={18} />
          <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
        </button>

        {/* Back */}
        <div className="px-4 py-3 border-t border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition"
          >
            <Icon name="arrowLeft" size={13} />
            <span>Back to GearUp</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#183d1d] border-b border-white/10 flex items-center justify-between px-4 py-3">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="GearUp"
            width={24}
            height={24}
            style={{ width: 24, height: 24, objectFit: 'contain' }}
          />
          <span className="text-sm font-black tracking-tight text-white">
            Admin
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-white/80"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
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
        <div className="w-8 h-8 rounded-full bg-gearup-600 text-white flex items-center justify-center font-bold text-xs">
          {initial}
        </div>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>

      <aside className="hidden lg:flex w-60 shrink-0 sticky top-0 h-dvh overflow-hidden">
        {content}
      </aside>
    </>
  );
}