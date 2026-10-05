'use client';

import { useEffect, useState } from 'react';

 interface Props {
  href?: string;
  variant?: 'light' | 'dark';
}

export function NotificationBellRow({
  href = '/owner/notifications',
  variant = 'light',
}: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count', {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (active) setCount(data.count ?? 0);
        }
      } catch {
        // silent
      }
    };
    load();
    const interval = setInterval(load, 30000);

    // Listen for optimistic updates dispatched by the list page
    const onChanged = () => load();
    window.addEventListener('notifications:changed', onChanged);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('notifications:changed', onChanged);
    };
  }, []);

  const containerClass =
    variant === 'dark'
      ? 'text-white/70 hover:bg-white/10 hover:text-white'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  const zeroClass = variant === 'dark' ? 'text-white/40' : 'text-gray-400';

  return (
    <a
      href={href}
      className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold transition ${containerClass}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span>Notifications</span>
      {count > 0 ? (
        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-600 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      ) : (
        <span className={`ml-auto text-[10px] ${zeroClass}`}>0</span>
      )}
    </a>
  );
}