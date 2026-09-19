'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.message ?? 'Login failed');
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT: hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative text-white">
        <Image
          src="/camping-bg.jpg"
          alt="Camping under the stars"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
       <div className="relative z-10 flex flex-col justify-center p-14 w-full">
          <h1 className="text-5xl xl:text-6xl font-black leading-[1.05] uppercase tracking-tight max-w-lg">
            GearUp for your next camping adventure
          </h1>
          <p className="mt-6 text-lg xl:text-xl text-white/90 max-w-md">
            Plan, book, rent and buy gear in one place.
          </p>
        </div>
      </div>

      {/* RIGHT: card */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
          {/* Logo + wordmark */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image
              src="/logo.png"
              alt="GearUp"
              width={56}
              height={56}
              priority
              style={{ width: 'auto', height: 'auto' }}
            />
            <span className="text-3xl font-black tracking-tight">
              <span className="text-gray-900">Gear</span>
              <span className="text-gearup-600">Up</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900">
            Welcome back to GearUp!
          </h2>
          <p className="text-center text-gray-600 text-sm mt-2 mb-8">
            Sign in to manage your outdoor experiences.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                ✉
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                🔒
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-gearup-600"
                />
                Remember Me
              </label>
              <Link href="#" className="text-gearup-700 hover:underline">
                Forgot Password?
              </Link>
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-semibold py-4 rounded-lg transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-gearup-700 font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}