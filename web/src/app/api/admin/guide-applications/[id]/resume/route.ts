import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ message: 'Unauthenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch(
    `${API_URL}/admin/guide-applications/${id}/resume`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      },
      cache: 'no-store',
    },
  );

  // Pass through the PDF bytes and headers so the browser can render it.
  if (!res.ok) {
    return new Response(JSON.stringify({ message: 'Resume not available' }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const blob = await res.arrayBuffer();
  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="resume-${id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}