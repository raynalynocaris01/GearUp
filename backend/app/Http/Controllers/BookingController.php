<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\GearItem;
use App\Models\TourGuide;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Booking::with(['campsite', 'tourGuide', 'gearItem', 'review'])
                ->where('user_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'campsite_id' => ['nullable', 'integer', 'exists:campsites,id'],
            'tour_guide_id' => ['nullable', 'integer', 'exists:tour_guides,id'],
            'gear_item_id' => ['nullable', 'integer', 'exists:gear_items,id'],
            'check_in' => ['nullable', 'date', 'after_or_equal:today'],
            'check_out' => ['nullable', 'date', 'after:check_in'],
            'gear_start_date' => ['nullable', 'date', 'after_or_equal:today'],
            'gear_end_date' => ['nullable', 'date', 'after:gear_start_date'],
            'gear_quantity' => ['nullable', 'integer', 'min:1'],
            'guests' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if (
            empty($data['campsite_id']) &&
            empty($data['tour_guide_id']) &&
            empty($data['gear_item_id'])
        ) {
            throw ValidationException::withMessages([
                'campsite_id' => [
                    'You must book a campsite, tour guide, or gear item.',
                ],
            ]);
        }

        $campsite = null;
        $tourGuide = null;
        $gearItem = null;
        $campsitePrice = 0;
        $guidePrice = 0;
        $gearPrice = 0;

        // ── Campsite pricing ────────────────────────────
        if (!empty($data['campsite_id'])) {
            $campsite = Campsite::findOrFail($data['campsite_id']);

            if (empty($data['check_in']) || empty($data['check_out'])) {
                throw ValidationException::withMessages([
                    'check_in' => [
                        'Check-in and check-out dates are required when booking a campsite.',
                    ],
                ]);
            }

            if ($data['guests'] > $campsite->capacity) {
                throw ValidationException::withMessages([
                    'guests' => [
                        "This campsite allows a maximum of {$campsite->capacity} guests.",
                    ],
                ]);
            }

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
        }

        // ── Tour guide pricing ──────────────────────────
        if (!empty($data['tour_guide_id'])) {
            $tourGuide = TourGuide::findOrFail($data['tour_guide_id']);

            if ($campsite && $tourGuide->campsite_id && $tourGuide->campsite_id !== $campsite->id) {
                throw ValidationException::withMessages([
                    'tour_guide_id' => [
                        'That tour guide is not available for this campsite.',
                    ],
                ]);
            }

            $guidePrice = (float) $tourGuide->price_per_trip;
        }

        // ── Gear pricing ────────────────────────────────
        if (!empty($data['gear_item_id'])) {
            $gearItem = GearItem::findOrFail($data['gear_item_id']);

            $qty = $data['gear_quantity'] ?? 1;

            if (!$gearItem->is_available) {
                throw ValidationException::withMessages([
                    'gear_item_id' => ['That gear item is not currently available.'],
                ]);
            }

            if ($gearItem->stock < $qty) {
                throw ValidationException::withMessages([
                    'gear_quantity' => [
                        "Only {$gearItem->stock} of this item left in stock.",
                    ],
                ]);
            }

            // Determine rental dates — fall back to campsite dates if not given
            $gStart = $data['gear_start_date'] ?? $data['check_in'] ?? null;
            $gEnd = $data['gear_end_date'] ?? $data['check_out'] ?? null;

            if (!$gStart || !$gEnd) {
                throw ValidationException::withMessages([
                    'gear_start_date' => [
                        'Rental dates are required when renting gear.',
                    ],
                ]);
            }

            $gs = new \DateTime($gStart);
            $ge = new \DateTime($gEnd);
            $days = max(1, $gs->diff($ge)->days);

            $gearPrice = (float) $gearItem->price_per_day * $days * $qty;
        }

        $total = $campsitePrice + $guidePrice + $gearPrice;

        $booking = DB::transaction(function () use ($data, $request, $campsite, $tourGuide, $gearItem, $total) {
            return Booking::create([
                'user_id' => $request->user()->id,
                'campsite_id' => $campsite?->id,
                'tour_guide_id' => $tourGuide?->id,
                'gear_item_id' => $gearItem?->id,
                'check_in' => $data['check_in'] ?? null,
                'check_out' => $data['check_out'] ?? null,
                'gear_start_date' => $data['gear_start_date'] ?? $data['check_in'] ?? null,
                'gear_end_date' => $data['gear_end_date'] ?? $data['check_out'] ?? null,
                'gear_quantity' => $gearItem ? ($data['gear_quantity'] ?? 1) : null,
                'guests' => $data['guests'],
                'total_price' => $total,
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);
        });
        $this->notifyBookingCreated($booking);

        return response()->json(
            $booking->load(['campsite', 'tourGuide', 'gearItem']),
            201
        );
    }

    public function show(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }

        return response()->json(
            $booking->load(['campsite', 'tourGuide', 'gearItem', 'review'])
        );
    }

    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }

        $booking->update(['status' => 'cancelled']);

        return response()->json(
            $booking->load(['campsite', 'tourGuide', 'gearItem'])
        );
    }


        /**
     * Notify the owner (campsite/gear/tour-guide) of a new booking.
     */
    private function notifyBookingCreated(Booking $booking): void
    {
        $actorId = $booking->user_id;

        if ($booking->campsite_id) {
            $booking->loadMissing('campsite');
            $ownerId = $booking->campsite?->owner_id;
            if ($ownerId) {
                NotificationService::notifyOthers(
                    $actorId,
                    $ownerId,
                    'booking.created',
                    'New campsite booking',
                    "Booking #{$booking->id} for {$booking->campsite->name}",
                    '/owner/bookings',
                );
            }
        } elseif ($booking->gear_item_id) {
            $booking->loadMissing('gearItem');
            $ownerId = $booking->gearItem?->owner_id;
            if ($ownerId) {
                NotificationService::notifyOthers(
                    $actorId,
                    $ownerId,
                    'gear.rented',
                    'Your gear was rented',
                    "Booking #{$booking->id} for {$booking->gearItem->name}",
                    '/my-gear/bookings',
                );
            }
        } elseif ($booking->tour_guide_id) {
            $booking->loadMissing('tourGuide.campsite');
            $ownerId = $booking->tourGuide?->campsite?->owner_id;
            if ($ownerId) {
                NotificationService::notifyOthers(
                    $actorId,
                    $ownerId,
                    'booking.created',
                    'New tour guide booking',
                    "Booking #{$booking->id} for {$booking->tourGuide->name}",
                    '/owner/bookings',
                );
            }
        }
    }
}