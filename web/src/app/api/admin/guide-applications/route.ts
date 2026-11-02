import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  // Strip empty ?status= so the backend gets no filter (returns all).
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const query = status ? `?status=${status}` : '';
  const res = await fetch(`${API_URL}/admin/guide-applications${query}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.status });
}