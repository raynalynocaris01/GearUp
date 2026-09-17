'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      else setGeneralError(data.message ?? 'Signup failed');
      return;
    }

    router.push('/dashboard');
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create your GearUp account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            className="border p-2 w-full rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>
          )}
        </div>

        <div>
          <input
            className="border p-2 w-full rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>
          )}
        </div>

        <div>
          <input
            className="border p-2 w-full rounded"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>
          )}
        </div>

        <div>
          <input
            className="border p-2 w-full rounded"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Confirm password"
            required
          />
        </div>

        <button
          className="bg-black text-white px-4 py-2 rounded w-full"
          type="submit"
        >
          Create account
        </button>

        {generalError && (
          <p className="text-red-600 text-sm">{generalError}</p>
        )}
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 underline">
          Log in
        </Link>
      </p>
    </main>
  );
}