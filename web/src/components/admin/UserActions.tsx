'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Props {
  userId: number;
  role: 'admin' | 'owner' | 'customer';
  isApproved: boolean;
  isSuspended: boolean;
}

type ModalState = {
  action: 'approve' | 'reject' | 'suspend' | 'reinstate';
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger' | 'primary';
} | null;

export function UserActions({
  userId,
  role,
  isApproved,
  isSuspended,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);

  const runAction = async () => {
    if (!modal) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${modal.action}`, {
        method: 'POST',
      });
      if (res.ok) {
        setModal(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (role === 'admin') {
    return <span className="text-xs text-gray-400 italic">—</span>;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-end">
        {role === 'owner' && !isApproved && (
          <>
            <button
              onClick={() =>
                setModal({
                  action: 'approve',
                  title: 'Approve this business owner?',
                  message:
                    'They will gain access to the owner dashboard and be able to post campsites.',
                  confirmLabel: 'Approve',
                  variant: 'primary',
                })
              }
              className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-3 py-2 rounded-lg transition"
            >
              Approve
            </button>
            <button
              onClick={() =>
                setModal({
                  action: 'reject',
                  title: 'Reject this business owner?',
                  message:
                    'They will be downgraded to a regular customer and will not be able to post campsites.',
                  confirmLabel: 'Reject',
                  variant: 'danger',
                })
              }
              className="text-xs font-semibold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition"
            >
              Reject
            </button>
          </>
        )}

        {!isSuspended ? (
          <button
            onClick={() =>
              setModal({
                action: 'suspend',
                title: 'Suspend this user?',
                message:
                  'They will be logged out of all sessions and unable to log in until reinstated.',
                confirmLabel: 'Suspend',
                variant: 'danger',
              })
            }
            className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition"
          >
            Suspend
          </button>
        ) : (
          <button
            onClick={() =>
              setModal({
                action: 'reinstate',
                title: 'Reinstate this user?',
                message:
                  'They will regain full access to their account immediately.',
                confirmLabel: 'Reinstate',
                variant: 'primary',
              })
            }
            className="text-xs font-semibold text-gearup-600 border border-gearup-200 bg-gearup-50 hover:bg-gearup-100 px-3 py-2 rounded-lg transition"
          >
            Reinstate
          </button>
        )}
      </div>

      <ConfirmModal
        open={modal !== null}
        title={modal?.title ?? ''}
        message={modal?.message ?? ''}
        confirmLabel={modal?.confirmLabel ?? 'Confirm'}
        variant={modal?.variant ?? 'danger'}
        loading={loading}
        onConfirm={runAction}
        onCancel={() => !loading && setModal(null)}
      />
    </>
  );
}