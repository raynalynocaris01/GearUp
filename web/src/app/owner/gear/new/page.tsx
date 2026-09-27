import Link from 'next/link';
import { GearForm } from '@/components/owner/GearForm';

export default function NewGearPage() {
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
          Add a gear item
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Fill in the details below. Customers will see this once you save.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-3xl">
        <GearForm mode="create" />
      </div>
    </div>
  );
}