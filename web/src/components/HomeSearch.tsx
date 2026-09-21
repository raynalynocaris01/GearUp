'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/campsites?search=${encodeURIComponent(q)}` : '/campsites');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-10 max-w-xl">
      <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-lg">
        <span className="pl-3 text-gray-400">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Where do you want to go?"
          className="flex-1 px-2 py-2 text-gray-900 placeholder-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
        >
          Explore Now
        </button>
      </div>
    </form>
  );
}