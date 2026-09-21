<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\TourGuide;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /**
     * GET /api/bookings
     */
    public function index(Request $request)
    {
        return response()->json(
            Booking::with(['campsite', 'tourGuide', 'review'])
                ->where('user_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->get()
        );
    }

    /**
     * POST /api/bookings
     * Accepts:
     * - campsite_id (optional)
     * - tour_guide_id (optional)
     * - check_in, check_out, guests
     * - notes
     * At least one of campsite_id or tour_guide_id must be present.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'campsite_id' => ['nullable', 'integer', 'exists:campsites,id'],
            'tour_guide_id' => ['nullable', 'integer', 'exists:tour_guides,id'],
            'check_in' => ['nullable', 'date', 'after_or_equal:today'],
            'check_out' => ['nullable', 'date', 'after:check_in'],
            'guests' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if (empty($data['campsite_id']) && empty($data['tour_guide_id'])) {
            throw ValidationException::withMessages([
                'campsite_id' => [
                    'You must book a campsite, a tour guide, or both.',
                ],
            ]);
        }

        $campsite = null;
        $tourGuide = null;
        $campsitePrice = 0;
        $guidePrice = 0;

        // ── Campsite pricing ──────────────────────────────
        if (!empty($data['campsite_id'])) {
            $campsite = Campsite::findOrFail($data['campsite_id']);

            if (!empty($data['check_in']) && !empty($data['check_out'])) {
                if ($data['guests'] > $campsite->capacity) {
                    throw ValidationException::withMessages([
                        'guests' => [
                            "This campsite allows a maximum of {$campsite->capacity} guests.",
                        ],
                    ]);
                }

                // Overlap check
                $overlap = Booking::where('campsite_id', $campsite->id)
                    ->whereNotIn('status', ['cancelled'])
                    ->where(function ($q) use ($data) {
                        $q->where('check_in', '<', $data['check_out'])
                          ->where('check_out', '>', $data['check_in']);
                    })
                    ->exists();

                if ($overlap) {
                    throw ValidationException::withMessages([
                        'check_in' => [
                            'Those dates are already booked for this campsite.',
                        ],
                    ]);
                }

                $start = new \DateTime($data['check_in']);
                $end = new \DateTime($data['check_out']);
                $nights = max(1, $start->diff($end)->days);

                $campsitePrice = $campsite->price_unit === 'entrance'
                    ? (float) $campsite->price_per_night * $data['guests']
                    : (float) $campsite->price_per_night * $nights * $data['guests'];
            } else {
                throw ValidationException::withMessages([
                    'check_in' => [
                        'Check-in and check-out dates are required when booking a campsite.',
                    ],
                ]);
            }
        }

        // ── Tour guide pricing ────────────────────────────
        if (!empty($data['tour_guide_id'])) {
            $tourGuide = TourGuide::findOrFail($data['tour_guide_id']);

            // If a guide is attached to a campsite, they can only be booked
            // for that campsite (or standalone — but we allow both).
            if ($campsite && $tourGuide->campsite_id && $tourGuide->campsite_id !== $campsite->id) {
                throw ValidationException::withMessages([
                    'tour_guide_id' => [
                        'That tour guide is not available for this campsite.',
                    ],
                ]);
            }

            $guidePrice = (float) $tourGuide->price_per_trip;
        }

        $total = $campsitePrice + $guidePrice;

        $booking = DB::transaction(function () use ($data, $request, $campsite, $tourGuide, $total) {
            return Booking::create([
                'user_id' => $request->user()->id,
                'campsite_id' => $campsite?->id,
                'tour_guide_id' => $tourGuide?->id,
                'check_in' => $data['check_in'] ?? null,
                'check_out' => $data['check_out'] ?? null,
                'guests' => $data['guests'],
                'total_price' => $total,
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);
        });

        return response()->json(
            $booking->load(['campsite', 'tourGuide']),
            201
        );
    }

    /**
     * GET /api/bookings/{booking}
     */
    public function show(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }

        return response()->json(
            $booking->load(['campsite', 'tourGuide', 'review'])
        );
    }

    /**
     * POST /api/bookings/{booking}/cancel
     */
    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }

        $booking->update(['status' => 'cancelled']);

        return response()->json(
            $booking->load(['campsite', 'tourGuide'])
        );
    }
}