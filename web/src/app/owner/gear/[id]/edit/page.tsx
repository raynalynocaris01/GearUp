import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { GearForm } from '@/components/owner/GearForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface GearItem {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price_per_day: string;
  image_url: string | null;
  stock: number;
  is_available: boolean;
}

async function getGear(token: string, id: string): Promise<GearItem | null> {
  try {
    const res = await fetch(`${API_URL}/owner/gear/${id}`, {
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

export default async function EditGearPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const gear = await getGear(token, id);

  if (!gear) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/owner/gear"
          className="text-sm text-gray-500 hover:text-gearup-600"
        >
          ← Back to my gear
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mt-4">
          Edit gear item
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Update the details below. Changes take effect immediately.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-3xl">
        <GearForm
          mode="edit"
          initial={{
            id: gear.id,
            name: gear.name,
            description: gear.description ?? '',
            category: gear.category,
            price_per_day: gear.price_per_day,
            image_url: gear.image_url ?? '',
            stock: gear.stock,
            is_available: gear.is_available,
          }}
        />
      </div>
    </div>
  );
}