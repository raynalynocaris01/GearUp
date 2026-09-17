'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    if (!agreed) {
      setGeneralError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      else setGeneralError(data.message ?? 'Signup failed');
      return;
    }

    router.push('/dashboard');
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
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 overflow-y-auto">
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
            Join GearUp Today.
          </h2>
          <p className="text-center text-gray-600 text-sm mt-2 mb-8">
            Create an account to start your adventure.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                ✉
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email[0]}</p>
              )}
            </div>

            {/* Password */}
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
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password[0]}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                🔒
              </span>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Confirmed Password"
                required
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 accent-gearup-600"
              />
              <span>
                I agree to the{' '}
                <Link href="#" className="text-gearup-700 underline">
                  Terms of Services
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-gearup-700 underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {generalError && (
              <p className="text-red-600 text-sm text-center">{generalError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-semibold py-4 rounded-lg transition"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-gearup-700 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}