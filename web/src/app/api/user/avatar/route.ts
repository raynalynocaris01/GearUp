import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const incomingFormData = await request.formData();

  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/user/avatar', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/json',
    },
    body: incomingFormData,
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
