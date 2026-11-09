'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// We need to check the user's password_must_change flag on mount
// and redirect to the forced change page if it's true.

interface ResumeStatus {
  has_application: boolean;
  application_id: number | null;
  status: string | null;
  resume_url: string | null;
  resume_uploaded_at: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
}

export default function GuideOnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<ResumeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/guide/resume', { cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setStatus(data);
    } catch {
      setError('Could not load your application status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check the user's password_must_change flag FIRST
    fetch('/api/user', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (user && user.password_must_change) {
          router.replace('/guide/profile?force=true');
          return;
        }
        // Only fetch resume status if password is already changed
        fetchStatus();
      })
      .catch(() => {
        setError('Could not load your account.');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccessMessage('');
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Resume must be a PDF.');
      setSelectedFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Resume must be 5 MB or smaller.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await fetch('/api/guide/resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message ?? 'Upload failed. Please try again.');
        return;
      }

      setSuccessMessage(
        'Resume uploaded. Your application is under review — you will be notified once an admin reviews it.',
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchStatus();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <p className="text-gray-600 text-sm">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (!status?.has_application) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="font-semibold text-amber-900 mb-2">
              No guide application found
            </p>
            <p className="text-sm text-amber-800 mb-4">
              You need to apply to become a guide before uploading a resume.
            </p>
            <Link
              href="/signup/guide"
              className="inline-block bg-gearup-600 hover:bg-gearup-700 text-white text-sm font-semibold px-4 py-2 rounded-md"
            >
              Apply to become a guide
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = status.status === 'approved' || status.status === 'auto_approved';
  const isRejected = status.status === 'rejected';
  const isUnderReview = status.status === 'under_review';
  const isPending = status.status === 'pending';

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">
          Guide Application
        </h1>
        <p className="text-gray-600 text-sm mt-2">
          Upload a PDF resume so an admin can review your guide application.
        </p>
      </div>

      {/* Status banner */}
      <div className="mb-6">
        {isApproved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-semibold text-green-900">Approved</p>
            <p className="text-sm text-green-800 mt-1">
              Your guide application has been approved. Head to your guide
              profile to complete your listing details.
            </p>
            <Link
              href="/guide/profile"
              className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-md"
            >
              Go to guide profile
            </Link>
          </div>
        )}
        {isUnderReview && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold text-blue-900">Under review</p>
            <p className="text-sm text-blue-800 mt-1">
              Your resume is with our team. We will notify you once a decision
              is made. You can re-upload below if you need to replace it.
            </p>
          </div>
        )}
        {isPending && !status.resume_url && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-semibold text-amber-900">
              Resume required
            </p>
            <p className="text-sm text-amber-800 mt-1">
              Upload a PDF resume to send your application to our review team.
            </p>
          </div>
        )}
        {isRejected && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-semibold text-red-900">
              Application declined
            </p>
            {status.rejection_reason && (
              <p className="text-sm text-red-800 mt-1">
                Reason: {status.rejection_reason}
              </p>
            )}
            <p className="text-sm text-red-800 mt-2">
              You can re-upload a new resume to re-apply below.
            </p>
          </div>
        )}
      </div>

      {/* Current resume info */}
      {status.resume_url && (
        <div className="mb-6 border border-gray-200 rounded-xl p-4 bg-gray-50">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            Resume on file
          </p>
          <p className="text-xs text-gray-600">
            Uploaded:{' '}
            {status.resume_uploaded_at
              ? new Date(status.resume_uploaded_at).toLocaleString()
              : 'unknown'}
          </p>
        </div>
      )}

      {/* Upload form — always visible so guides can replace their resume
          even after approval. Re-uploading flips the application back
          to under_review (admin re-checks; guide stays bookable). */}
      <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            {status.resume_url ? 'Replace your resume' : 'Upload your resume'}
          </p>
          {isApproved && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
              Heads up: re-uploading your resume will send your application
              back to admin review. You&apos;ll remain bookable while it&apos;s
              re-checked.
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gearup-50 file:text-gearup-700 file:font-semibold hover:file:bg-gearup-100"
          />
          <p className="text-xs text-gray-500 mt-2">
            PDF only. Maximum 5 MB.
          </p>
          {selectedFile && (
            <p className="text-xs text-gray-700 mt-2">
              Selected: <span className="font-medium">{selectedFile.name}</span>{' '}
              ({(selectedFile.size / 1024).toFixed(0)} KB)
            </p>
          )}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="mt-4 bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-md transition"
          >
            {uploading ? 'Uploading...' : 'Upload resume'}
          </button>
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
          {successMessage && (
            <p className="text-green-700 text-xs mt-2">{successMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}