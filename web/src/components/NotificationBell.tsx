'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AppNotification } from '@gearup/shared';

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        fetch('/api/notifications?limit=20', { cache: 'no-store' }),
        fetch('/api/notifications/unread-count', { cache: 'no-store' }),
      ]);
      if (listRes.ok) setItems(await listRes.json());
      if (countRes.ok) {
        const c = await countRes.json();
        setUnread(c.count ?? 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    await load();
  };

  const onClickItem = async (n: AppNotification) => {
    if (!n.read_at) {
      await fetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
    }
    setOpen(false);
    if (n.action_url) {
      router.push(n.action_url);
    } else {
      router.refresh();
      load();
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
        aria-label="Notifications"
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
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900">
              Notifications
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-gearup-600 hover:text-gearup-700"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                Loading...
              </p>
            ) : items.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                No notifications yet
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onClickItem(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                        n.read_at ? '' : 'bg-gearup-50/40'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read_at && (
                          <span className="mt-1 w-2 h-2 rounded-full bg-gearup-600 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {n.body}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}