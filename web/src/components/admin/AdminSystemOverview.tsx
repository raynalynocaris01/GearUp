import type { AdminDashboardStats } from '@gearup/shared';

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function AdminSystemOverview({
  stats,
}: {
  stats: AdminDashboardStats;
}) {
  const cells = [
    {
      label: 'System Health',
      value: 'Good',
      accent: 'text-green-600',
    },
    {
      label: 'Pending Verifications',
      value: String(stats.pending_owners),
      accent: 'text-yellow-600',
    },
    {
      label: 'Total Transactions',
      value: formatCompact(stats.total_bookings),
      accent: 'text-gray-900',
    },
    {
      label: 'Active Campsites',
      value: formatCompact(stats.total_campsites),
      accent: 'text-gray-900',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
        System Overview
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {cells.map((c) => (
          <div key={c.label} className="bg-gray-50 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              {c.label}
            </p>
            <p className={`text-2xl font-black mt-1 ${c.accent}`}>
              {c.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}