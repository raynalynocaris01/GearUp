'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  role: string;
  isApproved: boolean;
}

export function BecomeGuideCard({ role, isApproved }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Already a guide — show status
  if (role === 'guide') {
    return (
      <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          Tour Guide Account
        </p>
        {isApproved ? (
          <p className="text-xs text-gray-600">
            Your guide profile is live. Head to your guide dashboard to
            manage bookings and update your listing.
          </p>
        ) : (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
            Your guide application is pending admin approval. You&apos;ll be
            notified once you&apos;re approved.
          </p>
        )}
      </div>
    );
  }

  // Already an owner — can't be a guide
  if (role === 'owner') {
    return (
      <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          Owner Account
        </p>
        <p className="text-xs text-gray-600">
          Your account is an owner account. Tour guides are a separate role.
        </p>
      </div>
    );
  }

  // Role is 'customer' — show the CTA
  const handleBecomeGuide = async () => {
    if (
      !confirm(
        'Become a tour guide? Your application will be reviewed by our team.',
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/user/become-guide', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Could not submit application.');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gearup-200 bg-gearup-50 rounded-lg p-5">
      <p className="text-sm font-semibold text-gearup-900 mb-1">
        Become a Tour Guide
      </p>
      <p className="text-xs text-gray-700 mb-3">
        Share your local knowledge and earn by leading guided trips. Our team
        reviews every application.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleBecomeGuide}
          disabled={submitting}
          className="inline-block bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-md transition"
        >
          {submitting ? 'Submitting...' : 'Apply to become a guide'}
        </button>
        <a
          href="/signup/guide"
          className="inline-block border border-gearup-600 text-gearup-700 text-sm font-semibold px-4 py-2 rounded-md hover:bg-white transition"
        >
          Learn more
        </a>
      </div>
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
}