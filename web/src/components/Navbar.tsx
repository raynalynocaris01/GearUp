'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserMenu } from './UserMenu';

type NavbarProps = {
  user?: {
    name: string;
    email: string;
    role?: string;
    is_approved?: boolean;
  } | null;
};

const LINKS = [
  { href: '/', label: 'Home', exact: true },
  { href: '/about', label: 'About Us' },
  { href: '/campsites', label: 'Campsites' },
  { href: '/tour-guides', label: 'Tour Guides' },
  { href: '/gear-rental', label: 'Gear Rental' },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="GearUp"
            width={36}
            height={36}
            style={{ width: 'auto', height: 'auto' }}
          />
          <span className="text-2xl font-black tracking-tight">
            <span className="text-gray-900">Gear</span>
            <span className="text-gearup-600">Up</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
          {LINKS.map((link) => (
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
          ))}

          {user && user.role !== 'owner' && (
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

          {user && user.role === 'owner' && user.is_approved && (
            <Link
              href="/owner"
              className={`transition ${
                isActive('/owner')
                  ? 'text-gearup-600 font-semibold'
                  : 'hover:text-gearup-600'
              }`}
            >
              Manage
            </Link>
          )}
          {user && user.role === 'admin' && (
            <Link
              href="/admin"
              className={`transition ${
                isActive('/admin')
                  ? 'text-gearup-600 font-semibold'
                  : 'hover:text-gearup-600'
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link
                href="/signup/business"
                className="hidden md:inline-block text-sm text-gray-600 hover:text-gearup-600 font-medium transition"
              >
                Become a Host
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
  );
}