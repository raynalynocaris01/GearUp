'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { NotificationBellRow } from '@/components/NotificationBellRow';

type IconName = 'bookings' | 'profile' | 'logout' | 'arrowLeft' | 'document';

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: '/guide', label: 'Bookings', icon: 'bookings', exact: true },
  { href: '/guide/profile', label: 'Profile', icon: 'profile' },
  { href: '/guide-onboarding', label: 'Guide Application', icon: 'document' },
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
    bookings: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    profile: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
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
  guideName?: string;
  guideEmail?: string;
}

export function GuideSidebar({
  guideName = 'Tour Guide',
  guideEmail = '',
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const mobilePageTitle = (() => {
    if (pathname === '/guide') return 'Bookings';
    if (pathname.startsWith('/guide/profile')) return 'Profile';
    if (pathname.startsWith('/guide-onboarding')) return 'Guide Application';
    if (pathname.startsWith('/guide/notifications')) return 'Notifications';
    return 'Guide';
  })();

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

  const initial = guideName.charAt(0).toUpperCase();

  const content = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 shrink-0"
      >
        <Image
          src="/logo.png"
          alt="GearUp"
          width={32}
          height={32}
          style={{ width: 32, height: 32, objectFit: 'contain' }}
        />
        <span className="text-lg font-black tracking-tight">
          <span className="text-gray-900">Gear</span>
          <span className="text-gearup-600">Up</span>
        </span>
      </Link>

      {/* Guide context */}
      <div className="px-5 py-2.5 border-b border-gray-100 shrink-0">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
          Tour Guide Dashboard
        </p>
        <p className="text-sm font-bold text-gray-900 mt-0.5">{guideName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 min-h-0">
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition ${
                  active
                    ? 'bg-gearup-50 text-gearup-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span
                  className={`shrink-0 ${active ? 'text-gearup-600' : 'text-gray-400'}`}
                >
                  <Icon name={item.icon} size={20} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 shrink-0 pb-4">
        {/* Notification bell */}
        <NotificationBellRow href="/guide/notifications" />

        {/* User block */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gearup-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {guideName}
            </p>
            {guideEmail && (
              <p className="text-xs text-gray-500 truncate">{guideEmail}</p>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-left px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50 border-t border-gray-100 flex items-center gap-3"
        >
          <Icon name="logout" size={20} />
          <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
        </button>

        {/* Back to GearUp */}
        <div className="px-5 py-3 border-t border-gray-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gearup-600 transition"
          >
            <Icon name="arrowLeft" size={14} />
            <span>Back to GearUp</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Inline CSS — no Tailwind dependency, no JS timing, no flash */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ge-guide-mobile-shell { display: block !important; }
            .ge-guide-desktop-shell { display: none !important; }
            @media (min-width: 1024px) {
              .ge-guide-mobile-shell { display: none !important; }
              .ge-guide-desktop-shell { display: block !important; }
            }
            .ge-guide-mobile-drawer {
              transition: transform 200ms ease-in-out;
            }
          `,
        }}
      />

      {/* Mobile shell: header + drawer (hidden >= 1024px via inline CSS) */}
      <div className="ge-guide-mobile-shell">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-gray-900"
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
          <span className="flex-1 text-center text-base font-black tracking-tight text-gray-900">
            {mobilePageTitle}
          </span>
          <div className="rounded-full bg-gearup-100 px-2.5 py-1">
            <span className="text-[9px] font-black tracking-widest text-gearup-700">
              GUIDE
            </span>
          </div>
        </div>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className="ge-guide-mobile-drawer fixed top-0 left-0 bottom-0 z-50 w-64 bg-white overflow-y-auto"
          style={{
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          {content}
        </aside>
      </div>

      {/* Desktop shell: sidebar (hidden < 1024px via inline CSS) */}
      <div className="ge-guide-desktop-shell">
        <aside className="flex w-60 shrink-0 sticky top-0 h-dvh overflow-hidden">
          {content}
        </aside>
      </div>
    </>
  );
}