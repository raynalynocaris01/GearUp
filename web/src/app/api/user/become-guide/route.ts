import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/user/become-guide`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}