import Link from 'next/link';

interface RecentUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer';
  is_approved: boolean;
  created_at: string;
}

function roleBadge(role: string, isApproved: boolean) {
  if (role === 'admin') {
    return (
      <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700">
        ADMIN
      </span>
    );
  }
  if (role === 'owner') {
    return isApproved ? (
      <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-green-100 text-green-700">
        OWNER
      </span>
    ) : (
      <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
        PENDING
      </span>
    );
  }
  return (
    <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
      CUSTOMER
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function AdminRecentUsers({ users }: { users: RecentUser[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Recent Users
        </h2>
        <Link
          href="/admin/users"
          className="text-xs font-bold text-gearup-600 hover:text-gearup-700"
        >
          View all
        </Link>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          No users yet.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {users.slice(0, 5).map((u) => (
            <li key={u.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gearup-50 text-gearup-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {u.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {u.email}
                  </p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  {roleBadge(u.role, u.is_approved)}
                  <span className="text-[10px] text-gray-400">
                    {formatDate(u.created_at)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}