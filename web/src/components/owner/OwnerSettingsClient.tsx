'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  initialName: string;
  initialEmail: string;
}

export function OwnerSettingsClient({ initialName, initialEmail }: Props) {
  const router = useRouter();

  // Profile section
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password section
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/owner/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? 'Could not update profile.');
      }
      setProfileMsg({ ok: true, text: 'Profile updated.' });
      router.refresh();
    } catch (err: any) {
      setProfileMsg({ ok: false, text: err?.message ?? 'Something went wrong.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSaving(true);
    setPwdMsg(null);
    try {
      const res = await fetch('/api/owner/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: current,
          password: next,
          password_confirmation: confirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ??
            data?.errors?.current_password?.[0] ??
            'Could not change password.',
        );
      }
      setPwdMsg({ ok: true, text: 'Password updated.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: any) {
      setPwdMsg({ ok: false, text: err?.message ?? 'Something went wrong.' });
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Profile
        </h2>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gearup-500 focus:border-transparent"
              required
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gearup-500 focus:border-transparent"
              required
              maxLength={255}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {profileSaving ? 'Saving...' : 'Save changes'}
            </button>
            {profileMsg && (
              <span
                className={`text-xs font-semibold ${
                  profileMsg.ok ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {profileMsg.text}
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Security card */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Security
        </h2>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Current password
            </label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gearup-500 focus:border-transparent"
              required
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              New password
            </label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gearup-500 focus:border-transparent"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-[11px] text-gray-400 mt-1">Minimum 8 characters.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gearup-500 focus:border-transparent"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={pwdSaving}
              className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {pwdSaving ? 'Updating...' : 'Update password'}
            </button>
            {pwdMsg && (
              <span
                className={`text-xs font-semibold ${
                  pwdMsg.ok ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {pwdMsg.text}
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}