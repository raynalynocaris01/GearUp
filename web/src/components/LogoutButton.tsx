'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded"
    >
      {loading ? 'Logging out...' : 'Log out'}
    </button>
  );
}