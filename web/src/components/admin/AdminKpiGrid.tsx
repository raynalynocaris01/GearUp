import Link from 'next/link';
import type { ReactNode } from 'react';

type KpiIcon = 'users' | 'campsites' | 'bookings' | 'revenue';

interface Kpi {
  label: string;
  value: string | number;
  icon: KpiIcon;
  href: string;
  accent: string;
  delta?: string;
}

function Icon({ name, size = 22 }: { name: KpiIcon; size?: number }) {
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

  const paths: Record<KpiIcon, ReactNode> = {
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
    revenue: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export function AdminKpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((k) => (
        <Link
          key={k.label}
          href={k.href}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-5"
        >
          <div
            className={`w-12 h-12 rounded-xl ${k.accent} flex items-center justify-center mb-4`}
          >
            <Icon name={k.icon} size={22} />
          </div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
            {k.label}
          </p>
          <p className="text-3xl font-black text-gray-900 mt-1">
            {k.value}
          </p>
          {k.delta && (
            <p className="text-xs text-gray-400 mt-1">{k.delta}</p>
          )}
        </Link>
      ))}
    </div>
  );
}