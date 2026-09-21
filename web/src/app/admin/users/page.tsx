import Link from 'next/link';
import { cookies } from 'next/headers';
import { UserActions } from '@/components/admin/UserActions';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer';
  is_approved: boolean;
  is_suspended: boolean;
  created_at: string;
}

async function getUsers(
  token: string,
  status?: string,
  role?: string,
): Promise<AdminUser[]> {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (role) params.append('role', role);

    const query = params.toString();
    const url = `${API_URL}/admin/users${query ? `?${query}` : ''}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function roleBadge(role: string, isApproved: boolean) {
  if (role === 'admin') {
    return (
      <span className="inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded bg-purple-100 text-purple-700">
        ADMIN
      </span>
    );
  }
  if (role === 'owner') {
    return isApproved ? (
      <span className="inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded bg-green-100 text-green-700">
        OWNER
      </span>
    ) : (
      <span className="inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded bg-yellow-100 text-yellow-800">
        PENDING
      </span>
    );
  }
  return (
    <span className="inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded bg-gray-100 text-gray-700">
      CUSTOMER
    </span>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; role?: string }>;
}) {
  const { status, role } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const users = await getUsers(token, status, role);

  const FILTERS = [
    { label: 'All', href: '/admin/users', active: !status && !role },
    {
      label: 'Pending Owners',
      href: '/admin/users?status=pending',
      active: status === 'pending',
    },
    {
      label: 'Suspended',
      href: '/admin/users?status=suspended',
      active: status === 'suspended',
    },
    {
      label: 'Owners',
      href: '/admin/users?role=owner',
      active: role === 'owner',
    },
    {
      label: 'Customers',
      href: '/admin/users?role=customer',
      active: role === 'customer',
    },
  ];

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Users</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {users.length} {users.length === 1 ? 'user' : 'users'} shown
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              f.active
                ? 'bg-gearup-600 text-white border-gearup-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">No users match this filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  User
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Role
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                  Joined
                </th>
                <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gearup-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      {roleBadge(u.role, u.is_approved)}
                      {u.is_suspended && (
                        <span className="inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded bg-red-100 text-red-700">
                          SUSPENDED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-xs text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <UserActions
                      userId={u.id}
                      role={u.role}
                      isApproved={u.is_approved}
                      isSuspended={u.is_suspended}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}