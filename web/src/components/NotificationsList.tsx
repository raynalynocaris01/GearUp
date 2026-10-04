'use client';

import { useState } from 'react';
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
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function NotificationsList({
  initial,
}: {
  initial: AppNotification[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    router.refresh();
  };

  const onClickItem = async (n: AppNotification) => {
    if (!n.read_at) {
      await fetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
        ),
      );
    }
    if (n.action_url) router.push(n.action_url);
  };

  const unread = items.filter((i) => !i.read_at).length;

  return (
    <>
      {unread > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {unread} unread {unread === 1 ? 'notification' : 'notifications'}
          </p>
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-bold text-gearup-600 hover:text-gearup-700"
          >
            Mark all read
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-base font-bold text-gray-900 mb-1">
            No notifications yet
          </p>
          <p className="text-sm text-gray-500">
            Activity on your listings and account will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onClickItem(n)}
                  className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition ${
                    n.read_at ? '' : 'bg-gearup-50/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.read_at && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-gearup-600 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-sm text-gray-600 mt-1">
                          {n.body}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {n.action_url && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400 shrink-0 mt-0.5"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}