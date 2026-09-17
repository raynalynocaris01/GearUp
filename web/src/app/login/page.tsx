'use client';

import { useState } from 'react';
import { createApiClient, authApi } from '@gearup/shared';

const api = createApiClient(
  process.env.NEXT_PUBLIC_API_URL!,
  async () => null,
);
const auth = authApi(api);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult('Logging in...');
    try {
      const res = await auth.login(email, password, 'next-web');
      setResult(`Logged in as ${res.data.user.name}`);
    } catch (err: any) {
      setResult(`Error: ${err.response?.data?.message ?? err.message}`);
    }
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
    </main>
  );
}