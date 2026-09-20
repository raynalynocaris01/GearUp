import Link from 'next/link';
import { CampsiteForm } from '@/components/owner/CampsiteForm';

export default function NewCampsitePage() {
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
          Post a new campsite
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Fill in the details below. Customers will see this once you save.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-3xl">
        <CampsiteForm mode="create" />
      </div>
    </div>
  );
}