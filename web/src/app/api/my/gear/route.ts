import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value ?? null;
}

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });

  const res = await fetch(`${API_URL}/my/gear`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });

  const body = await request.json();
  const res = await fetch(`${API_URL}/my/gear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}