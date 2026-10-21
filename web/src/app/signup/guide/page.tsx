'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// ──────────────────────────────────────────────────────────
// Icon components (module-level, defined once per module)
// ──────────────────────────────────────────────────────────

function EyeIcon() {
  return (
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
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
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function GuideSignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
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
        terms_accepted: true,
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
        password_confirmation: passwordConfirmation,
        role: 'guide',
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      else setGeneralError(data.message ?? 'Signup failed');
      return;
    }

    router.push('/profile');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT: hero */}
      <div className="hidden lg:flex lg:w-1/2 relative text-white">
        <Image
          src="/hike.jpg"
          alt="Hikers on a mountain trail"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col justify-center p-14 w-full">
          <h1 className="text-5xl xl:text-6xl font-black leading-[1.05] uppercase tracking-tight max-w-lg">
            Lead the adventure.
          </h1>
          <p className="mt-6 text-lg xl:text-xl text-white/90 max-w-md">
            Share your local knowledge and get paid to guide campers through
            hidden trails, secret spots, and unforgettable landscapes.
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
              style={{ width: 56, height: 56, objectFit: 'contain' }}
            />
            <span className="text-3xl font-black tracking-tight">
              <span className="text-gray-900">Gear</span>
              <span className="text-gearup-600">Up</span>
            </span>
          </div>

          <div className="text-center mb-6">
            <span className="inline-block text-[10px] font-extrabold tracking-wider px-3 py-1 rounded-full bg-gearup-50 text-gearup-700 mb-3">
              FOR TOUR GUIDES
            </span>
            <h2 className="text-2xl font-bold text-gray-900">
              Become a tour guide
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Sign up to offer guided trips on GearUp. We&apos;ll review your
              account and get you live within 24 hours.
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
                placeholder="Email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email[0]}</p>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                🔒
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                🔒
              </span>
              <input
                type={showPasswordConfirmation ? 'text' : 'password'}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Confirmed Password"
                required
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={
                  showPasswordConfirmation ? 'Hide password' : 'Show password'
                }
              >
                {showPasswordConfirmation ? <EyeOffIcon /> : <EyeIcon />}
              </button>
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
                <Link href="/terms" className="text-gearup-700 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-gearup-700 underline">
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
              {loading ? 'Creating account...' : 'Apply to become a guide'}
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
              Already a guide?{' '}
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
