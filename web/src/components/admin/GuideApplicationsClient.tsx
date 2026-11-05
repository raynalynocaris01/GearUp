'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

const SOURCE_LABELS: Record<Application['submission_source'], string> = {
  self_signup: 'Self-signup',
  customer_upgrade: 'Customer upgrade',
  owner_created: 'Owner-created',
  admin_created: 'Admin-created',
};

const STATUS_LABELS: Record<Application['status'], { label: string; className: string }> = {
  pending: { label: 'PENDING', className: 'bg-yellow-100 text-yellow-800' },
  under_review: { label: 'UNDER REVIEW', className: 'bg-blue-100 text-blue-800' },
  approved: { label: 'APPROVED', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'REJECTED', className: 'bg-red-100 text-red-700' },
  auto_approved: { label: 'AUTO-APPROVED', className: 'bg-teal-100 text-teal-700' },
};

export function GuideApplicationsClient({
  initialApplications,
}: {
  initialApplications: Application[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Application | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const closeDetail = () => {
    setSelected(null);
    setRejectMode(false);
    setRejectReason('');
    setError('');
  };

  const handleApprove = async () => {
    if (!selected) return;
    if (!confirm(`Approve ${selected.applicant?.name ?? 'this application'}?`)) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(
        `/api/admin/guide-applications/${selected.id}/approve`,
        { method: 'POST' },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'Approve failed.');
        return;
      }
      closeDetail();
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(
        `/api/admin/guide-applications/${selected.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejection_reason: rejectReason.trim() }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'Reject failed.');
        return;
      }
      closeDetail();
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialApplications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
        <p className="text-sm text-gray-500">No applications match this filter.</p>
      </div>
    );
  }

  return (
    <>
      {/* Inline CSS — no Tailwind dependency, no flash */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ge-ga-mobile-shell { display: block !important; }
            .ge-ga-desktop-shell { display: none !important; }
            @media (min-width: 1024px) {
              .ge-ga-mobile-shell { display: none !important; }
              .ge-ga-desktop-shell { display: block !important; }
            }
          `,
        }}
      />

      {/* Mobile card list (shown < 1024px) */}
      <div className="ge-ga-mobile-shell space-y-3">
        {initialApplications.map((app) => {
          const statusMeta = STATUS_LABELS[app.status];
          return (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gearup-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {(app.applicant?.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {app.applicant?.name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {app.applicant?.email ?? ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded ${statusMeta.className}`}
                >
                  {statusMeta.label}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-2 mt-2 text-xs text-gray-600 space-y-1">
                <p>
                  <span className="text-gray-400">Source: </span>
                  {SOURCE_LABELS[app.submission_source]}
                  {app.submitter && app.submitter.id !== app.applicant_user_id && (
                    <span className="text-gray-400"> by {app.submitter.name}</span>
                  )}
                </p>
                <p>
                  <span className="text-gray-400">Submitted: </span>
                  {new Date(app.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelected(app)}
                  className="text-xs font-semibold text-gearup-600 border border-gearup-200 bg-gearup-50 hover:bg-gearup-100 px-4 py-2 rounded-lg transition"
                >
                  Review
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table (shown >= 1024px) */}
      <div className="ge-ga-desktop-shell">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">Applicant</th>
              <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Source</th>
              <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Submitted</th>
              <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialApplications.map((app) => {
              const statusMeta = STATUS_LABELS[app.status];
              return (
                <tr key={app.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gearup-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {(app.applicant?.name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {app.applicant?.name ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {app.applicant?.email ?? ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-xs text-gray-600">
                      {SOURCE_LABELS[app.submission_source]}
                      {app.submitter && app.submitter.id !== app.applicant_user_id && (
                        <span className="block text-gray-400 mt-0.5">
                          by {app.submitter.name}
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-xs text-gray-500">
                      {new Date(app.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(app)}
                      className="text-xs font-semibold text-gearup-600 border border-gearup-200 bg-gearup-50 hover:bg-gearup-100 px-3 py-2 rounded-lg transition"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selected.applicant?.name ?? 'Application'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selected.applicant?.email ?? ''} · {SOURCE_LABELS[selected.submission_source]}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body — resume + actions */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left — resume preview */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resume</p>
                {selected.resume_url ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-72 lg:h-[500px]">
                    <iframe
                      src={`/api/admin/guide-applications/${selected.id}/resume`}
                      className="w-full h-full"
                      title={`Resume ${selected.id}`}
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                    <p className="text-sm text-gray-500">No resume attached.</p>
                  </div>
                )}
              </div>

              {/* Right — metadata + actions */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Details</p>
                  <dl className="text-sm space-y-2">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">Application ID</dt>
                      <dd className="font-semibold text-gray-900">#{selected.id}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">Submitted</dt>
                      <dd className="text-gray-900">
                        {new Date(selected.created_at).toLocaleString()}
                      </dd>
                    </div>
                    {selected.resume_uploaded_at && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Resume uploaded</dt>
                        <dd className="text-gray-900">
                          {new Date(selected.resume_uploaded_at).toLocaleString()}
                        </dd>
                      </div>
                    )}
                    {selected.reviewed_at && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Reviewed</dt>
                        <dd className="text-gray-900">
                          {new Date(selected.reviewed_at).toLocaleString()}
                        </dd>
                      </div>
                    )}
                    {selected.rejection_reason && (
                      <div className="pt-2 border-t border-gray-100">
                        <dt className="text-gray-500 text-xs mb-1">Rejection reason</dt>
                        <dd className="text-red-700 text-sm">{selected.rejection_reason}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Actions */}
                {(selected.status === 'under_review' || selected.status === 'pending') && !rejectMode && (
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={submitting}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition"
                    >
                      {submitting ? 'Approving...' : '✓ Approve application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectMode(true)}
                      disabled={submitting}
                      className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 font-semibold py-3 rounded-lg transition"
                    >
                      ✗ Reject application
                    </button>
                  </div>
                )}

                {rejectMode && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Reason for rejection *
                    </label>
                    <textarea
                      rows={4}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this application is being rejected. The guide will see this."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setRejectMode(false); setRejectReason(''); setError(''); }}
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={submitting || !rejectReason.trim()}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition"
                      >
                        {submitting ? 'Rejecting...' : 'Confirm rejection'}
                      </button>
                    </div>
                  </div>
                )}

                {(selected.status === 'approved' || selected.status === 'rejected' || selected.status === 'auto_approved') && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      This application is {STATUS_LABELS[selected.status].label.toLowerCase()}.
                      No further action needed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}