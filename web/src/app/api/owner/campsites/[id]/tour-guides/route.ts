import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  // Forward multipart/form-data directly to Laravel. The browser sets
  // the boundary in the Content-Type header — we don't override it.
  const incomingFormData = await request.formData();

  const res = await fetch(`${API_URL}/owner/campsites/${id}/tour-guides`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: incomingFormData,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}