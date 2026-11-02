import { cookies } from 'next/headers';
import Link from 'next/link';
import { GuideApplicationsClient } from '@/components/admin/GuideApplicationsClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Application {
  id: number;
  tour_guide_id: number | null;
  applicant_user_id: number;
  submitted_by_user_id: number | null;
  submission_source: 'self_signup' | 'customer_upgrade' | 'owner_created' | 'admin_created';
  resume_url: string | null;
  resume_uploaded_at: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'auto_approved';
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  applicant?: { id: number; name: string; email: string };
  submitter?: { id: number; name: string; email: string };
  reviewer?: { id: number; name: string; email: string } | null;
}

async function getApplications(
  token: string,
  status?: string,
): Promise<Application[]> {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const query = params.toString();
    const url = `${API_URL}/admin/guide-applications${query ? `?${query}` : ''}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function GuideApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  // Default to under_review — the primary admin review queue.
  // Only show "All" if the admin explicitly navigates via the All tab.
  const effectiveStatus = status ?? 'under_review';
  const applications = await getApplications(token, effectiveStatus);

  const FILTERS = [
    { label: 'All', href: '/admin/guide-applications?status=', active: status === '' },
    { label: 'Under review', href: '/admin/guide-applications', active: status === undefined || status === 'under_review' },
    { label: 'Pending', href: '/admin/guide-applications?status=pending', active: status === 'pending' },
    { label: 'Approved', href: '/admin/guide-applications?status=approved', active: status === 'approved' },
    { label: 'Rejected', href: '/admin/guide-applications?status=rejected', active: status === 'rejected' },
  ];

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Guide Applications</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Review applications and resumes from new tour guides.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              f.active
                ? 'bg-gearup-600 text-white border-gearup-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <GuideApplicationsClient initialApplications={applications} />
    </div>
  );
}