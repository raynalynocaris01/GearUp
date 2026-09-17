'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult('Logging in...');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setResult(`Error: ${data.message ?? 'Login failed'}`);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">GearUp Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="border p-2 w-full rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
        />
        <input
          className="border p-2 w-full rounded"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button
          className="bg-black text-white px-4 py-2 rounded w-full"
          type="submit"
        >
          Log in
        </button>
      </form>
      {result && <p className="mt-4 text-sm">{result}</p>}

      <p className="mt-4 text-sm text-gray-600">
    Don&apos;t have an account?{' '}
    <Link href="/signup" className="text-blue-600 underline">
      Sign up
    </Link>
  </p>

    </main>
  );
}