import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { CampsiteForm } from '@/components/owner/CampsiteForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Campsite {
  id: number;
  name: string;
  description: string;
  location: string;
  region: string;
  price_per_night: string;
  price_unit: string;
  image_url: string;
  capacity: number;
}

async function getCampsite(id: string, token: string): Promise<Campsite | null> {
  try {
    const res = await fetch(`${API_URL}/owner/campsites/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function EditCampsitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const campsite = await getCampsite(id, token);

  if (!campsite) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/owner/campsites"
          className="text-sm text-gray-500 hover:text-gearup-600"
        >
          ← Back to my campsites
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mt-4">
          Edit campsite
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Update the details for <strong>{campsite.name}</strong>.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-3xl">
        <CampsiteForm mode="edit" initial={campsite} />
      </div>
    </div>
  );
}