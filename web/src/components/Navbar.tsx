'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';

type NavbarProps = {
  user?: {
    name: string;
    email: string;
    role?: string;
    is_approved?: boolean;
    avatar_url?: string | null;
  } | null;
};

const LINKS = [
  { href: '/', label: 'Home', exact: true },
  { href: '/campsites', label: 'Campsites' },
  { href: '/tour-guides', label: 'Tour Guides' },
  { href: '/gear-rental', label: 'Gear Rental' },
  // [Events disabled 2026-10-14] - uncomment to re-enable
  // { href: '/events', label: 'Events' },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Inline CSS — no Tailwind dependency, no JS timing, no flash */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ge-public-mobile-shell { display: block !important; }
            .ge-public-desktop-shell { display: none !important; }
            @media (min-width: 1024px) {
              .ge-public-mobile-shell { display: none !important; }
              .ge-public-desktop-shell { display: block !important; }
            }
            .ge-public-mobile-drawer {
              transition: transform 200ms ease-in-out;
            }
          `,
        }}
      />

      {/* Mobile shell: header + drawer (hidden >= 1024px via inline CSS) */}
      <div className="ge-public-mobile-shell">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
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
            {user && <NotificationBell />}
          </div>

          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="GearUp"
              width={28}
              height={28}
              style={{ width: 28, height: 28, objectFit: 'contain' }}
            />
            <span className="text-lg font-black tracking-tight">
              <span className="text-gray-900">Gear</span>
              <span className="text-gearup-600">Up</span>
            </span>
          </Link>
        </div>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className="ge-public-mobile-drawer fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-xl overflow-y-auto"
          style={{
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <div className="flex flex-col p-6 gap-6">
            <div className="flex items-center justify-between">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="GearUp"
                  width={28}
                  height={28}
                  style={{ width: 28, height: 28, objectFit: 'contain' }}
                />
                <span className="text-lg font-black tracking-tight">
                  <span className="text-gray-900">Gear</span>
                  <span className="text-gearup-600">Up</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-900"
                aria-label="Close menu"
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-4 text-base font-medium text-gray-700">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`transition ${
                    isActive(link.href, link.exact)
                      ? 'text-gearup-600 font-semibold'
                      : 'hover:text-gearup-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link
                  href="/bookings"
                  onClick={() => setMobileOpen(false)}
                  className={`transition ${
                    isActive('/bookings')
                      ? 'text-gearup-600 font-semibold'
                      : 'hover:text-gearup-600'
                  }`}
                >
                  Bookings
                </Link>
              )}
            </nav>

            <div className="border-t border-gray-100 pt-6 flex flex-col gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <UserMenu user={user} />
                </>
              ) : (
                <>
                  <Link
                    href="/signup/business"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium text-gray-600"
                  >
                    Become a Host
                  </Link>
                  <Link
                    href="/signup/guide"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium text-gray-600"
                  >
                    Become a Guide
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="inline-block text-center px-5 py-2 rounded-lg border border-gearup-600 text-gearup-600 text-sm font-semibold hover:bg-gearup-50 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="inline-block text-center px-5 py-2 rounded-lg bg-gearup-600 text-white text-sm font-semibold hover:bg-gearup-700 transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Desktop shell (hidden < 1024px via inline CSS) */}
      <div className="ge-public-desktop-shell">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
                      <Image
            src="/logo.png"
            alt="GearUp"
            width={36}
            height={36}
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
          <span className="text-2xl font-black tracking-tight">
            <span className="text-gray-900">Gear</span>
            <span className="text-gearup-600">Up</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
          {LINKS.map(
            (link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition ${
                  isActive(link.href, link.exact)
                    ? 'text-gearup-600 font-semibold'
                    : 'hover:text-gearup-600'
                }`}
              >
                {link.label}
              </Link>
            ),
          )}

          {user && (
            <Link
              href="/bookings"
              className={`transition ${
                isActive('/bookings')
                  ? 'text-gearup-600 font-semibold'
                  : 'hover:text-gearup-600'
              }`}
            >
              Bookings
            </Link>
          )}

 
 
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell />
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link
                href="/signup/business"
                className="hidden md:inline-block text-sm text-gray-600 hover:text-gearup-600 font-medium transition"
              >
                Become a Host
              </Link>
              <Link
                href="/signup/guide"
                className="hidden md:inline-block text-sm text-gray-600 hover:text-gearup-600 font-medium transition"
              >
                Become a Guide
              </Link>
              <Link
                href="/login"
                className="hidden sm:inline-block px-5 py-2 rounded-lg border border-gearup-600 text-gearup-600 text-sm font-semibold hover:bg-gearup-50 transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="hidden sm:inline-block px-5 py-2 rounded-lg bg-gearup-600 text-white text-sm font-semibold hover:bg-gearup-700 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
      </header>
      </div>
    </>
  );
}