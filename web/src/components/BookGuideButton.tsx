'use client';

import { useState } from 'react';
import { GuideBookingForm } from '@/components/GuideBookingForm';

interface Props {
  guide: {
    id: number;
    name: string;
    price_per_trip: string;
  };
  isLoggedIn: boolean;
}

export function BookGuideButton({ guide, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className="block w-full bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-center py-3 rounded-lg transition"
      >
        Log in to book
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-center py-3 rounded-lg transition"
      >
        Book this guide
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Book {guide.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  PHP {Number(guide.price_per_trip).toFixed(0)} per trip
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <GuideBookingForm
                guide={guide}
                onDone={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}