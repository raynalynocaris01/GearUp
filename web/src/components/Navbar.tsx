import Link from 'next/link';
import Image from 'next/image';
import { UserMenu } from './UserMenu';

type NavbarProps = {
  user?: { name: string; email: string } | null;
};

export function Navbar({ user }: NavbarProps) {
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
          <Link href="/" className="text-gearup-600 font-semibold">
            Home
          </Link>
          <Link href="#" className="hover:text-gearup-600">
            About Us
          </Link>
          <Link href="/campsites" className="hover:text-gearup-600">
            Campsites
          </Link>
          <Link href="#" className="hover:text-gearup-600">
            Tour Guides
          </Link>
          <Link href="#" className="hover:text-gearup-600">
            Gear Rental
          </Link>
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
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