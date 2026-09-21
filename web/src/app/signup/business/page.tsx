'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function BusinessSignupPage() {
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
      setGeneralError(
        'Please agree to the Terms of Service and Privacy Policy.',
      );
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
        role: 'owner',
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      else setGeneralError(data.message ?? 'Signup failed');
      return;
    }

    router.push('/owner');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT: hero */}
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
        <div className="relative z-10 flex flex-col justify-end p-14 w-full">
          <h1 className="text-5xl xl:text-6xl font-black leading-[1.05] uppercase tracking-tight max-w-lg">
            Turn your campsite into a business.
          </h1>
          <p className="mt-6 text-lg xl:text-xl text-white/90 max-w-md">
            List your campsite on GearUp and reach thousands of campers.
          </p>
        </div>
      </div>

      {/* RIGHT: card */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 lg:p-10 my-8">
          <div className="flex items-center justify-center gap-3 mb-6">
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

          <div className="text-center mb-6">
            <span className="inline-block text-[10px] font-extrabold tracking-wider px-3 py-1 rounded-full bg-gearup-50 text-gearup-700 mb-3">
              FOR BUSINESS OWNERS
            </span>
            <h2 className="text-2xl font-bold text-gray-900">
              List your campsite
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Sign up to become a host. We'll review your account and get you
              live within 24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Business email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email[0]}</p>
              )}
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.password[0]}
                </p>
              )}
            </div>

            <div>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
            </div>

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
                  Host Agreement
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
              {loading ? 'Creating account...' : 'Apply to become a host'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm">
            <p className="text-gray-600">
              Just here to book a campsite?{' '}
              <Link
                href="/signup"
                className="text-gearup-700 font-semibold hover:underline"
              >
                Sign up as a camper
              </Link>
            </p>
            <p className="text-gray-600 mt-2">
              Already a host?{' '}
              <Link
                href="/login"
                className="text-gearup-700 font-semibold hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}