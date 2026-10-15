'use client';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Props {
  status: BookingStatus;
  createdAt: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

function fmtShort(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

function CheckIcon({ color = '#fff', size = 18 }: { color?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseCircleIcon({ color = '#dc2626', size = 20 }: { color?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

export function BookingStatusTracker({
  status,
  createdAt,
  confirmedAt,
  completedAt,
  cancelledAt,
}: Props) {
  // Cancelled is a distinct terminal state — no progress bar
  if (status === 'cancelled') {
    const cancelDate = fmtShort(cancelledAt);
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <CloseCircleIcon />
          </div>
          <div>
            <p className="text-sm font-bold text-red-900">
              Booking cancelled
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              {cancelDate
                ? `Cancelled on ${cancelDate}`
                : 'This booking was cancelled.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Progress model: pending → confirmed → completed
  const stepReached: 1 | 2 | 3 =
    status === 'completed' ? 3 : status === 'confirmed' ? 2 : 1;

  const steps = [
    { key: 'placed', label: 'Placed', date: fmtShort(createdAt) },
    { key: 'confirmed', label: 'Confirmed', date: fmtShort(confirmedAt) },
    { key: 'completed', label: 'Completed', date: fmtShort(completedAt) },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">
        Status
      </p>

      <div className="flex items-start">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum <= stepReached;
          const isCurrent = stepNum === stepReached;
          const isLast = idx === steps.length - 1;
          const nextIsDone = stepNum < stepReached;

          return (
            <div
              key={step.key}
              className="flex-1 flex flex-col items-center relative"
            >
              {!isLast && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 ${
                    nextIsDone ? 'bg-gearup-600' : 'bg-gray-200'
                  }`}
                />
              )}

              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition ${
                  isDone
                    ? 'bg-gearup-600 border-gearup-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                {isDone ? (
                  <CheckIcon />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>

              <p
                className={`mt-2 text-xs font-bold text-center ${
                  isCurrent
                    ? 'text-gearup-600'
                    : isDone
                      ? 'text-gray-900'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {step.date}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}