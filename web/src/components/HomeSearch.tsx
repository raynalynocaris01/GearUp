'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(
      q ? `/campsites?search=${encodeURIComponent(q)}` : '/campsites',
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mt-10 max-w-2xl">
      <div className="flex items-center gap-3 bg-white rounded-2xl p-2 shadow-xl">
        {/* Location pin icon */}
        <div className="pl-3 text-gray-400">
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Where do you want to go?"
          className="flex-1 px-2 py-3 text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent"
        />

        {/* Search button */}
        <button
          type="submit"
          className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          Explore Now
        </button>
      </div>
    </form>
  );
}