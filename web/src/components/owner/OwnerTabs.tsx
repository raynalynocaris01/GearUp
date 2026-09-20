'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/owner', label: 'Dashboard', exact: true },
  { href: '/owner/campsites', label: 'My Campsites' },
  { href: '/owner/bookings', label: 'Bookings' },
];

export function OwnerTabs() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                  isActive
                    ? 'border-gearup-600 text-gearup-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}