import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();

  const res = await fetch(
    `${API_URL}/tour-guides${query ? `?${query}` : ''}`,
    {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    },
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}