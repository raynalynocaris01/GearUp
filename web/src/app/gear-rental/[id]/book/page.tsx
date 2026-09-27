import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { BookingForm } from '@/components/BookingForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface GearItem {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  category: string;
  price_per_day: string;
  image_url: string | null;
  stock: number;
  is_available: boolean;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/user`, {
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

async function getGear(id: string): Promise<GearItem | null> {
  try {
    const res = await fetch(`${API_URL}/gear/${id}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function BookGearPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, gear] = await Promise.all([getCurrentUser(), getGear(id)]);

  if (!gear) notFound();
  if (!user) redirect('/login');

  if (!gear.is_available || gear.stock < 1) {
    redirect(`/gear-rental/${gear.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/gear-rental" className="hover:text-gearup-600">
            Gear Rental
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/gear-rental/${gear.id}`}
            className="hover:text-gearup-600"
          >
            {gear.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Rent</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: form */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              Complete your rental
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              Pick your dates and quantity. You can review everything before
              confirming.
            </p>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <BookingForm presetGearItem={gear} />
            </div>
          </div>

          {/* Right: gear summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {gear.image_url && (
                <div className="relative h-44 bg-gray-100">
                  <Image
                    src={gear.image_url}
                    alt={gear.name}
                    fill
                    sizes="400px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-bold text-gray-900">{gear.name}</h3>
                <p className="text-xs text-gearup-600 font-semibold mt-1">
                  {gear.category}
                </p>
                {gear.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-3">
                    {gear.description}
                  </p>
                )}
                <div className="border-t border-gray-100 my-4" />
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-500">Price</span>
                  <span className="text-xl font-black text-gearup-600">
                    ₱{gear.price_per_day}
                  </span>
                </div>
                <p className="text-xs text-gray-500 text-right">per day</p>
                <p className="text-xs text-gray-500 mt-3">
                  Stock: {gear.stock} available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}