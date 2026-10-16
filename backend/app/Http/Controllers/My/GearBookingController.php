<?php

namespace App\Http\Controllers\My;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class GearBookingController extends Controller
{
    /**
     * GET /api/my/gear-bookings
     * Returns bookings on the authenticated user's gear listings.
     * Optional: ?status=pending|confirmed|completed|cancelled
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $query = Booking::with([
            'user:id,name,email',
            'campsite:id,name,location,image_url',
            'roomCampsite:id,name,location,image_url,price_per_night,price_unit,capacity',
            'gearItem:id,name,image_url,category,price_per_day,owner_id',
            'gearItems' => function ($q) use ($userId) {
                // Only eager-load this host's lines from the pivot
                $q->where('gear_items.owner_id', $userId);
            },
        ])
            ->where(function ($q) use ($userId) {
                // Legacy single-gear bookings
                $q->whereHas('gearItem', function ($x) use ($userId) {
                    $x->where('owner_id', $userId);
                })
                // Multi-gear pivot bookings
                ->orWhereHas('gearItems', function ($x) use ($userId) {
                    $x->where('owner_id', $userId);
                });
            });

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $bookings = $query->orderByDesc('created_at')->get();

        return response()->json($bookings);
    }

    /**
     * GET /api/my/gear-bookings/{booking}
     * Returns a single booking with only the authenticated host's
     * gear lines. Used by the host-side booking detail page.
     */
    public function show(Request $request, Booking $booking)
    {
        $this->authorizeHost($request, $booking);

        $userId = $request->user()->id;

        $booking->load([
            'user:id,name,email',
            'campsite:id,name,location',
            'roomCampsite:id,name,location,image_url,price_per_night,price_unit,capacity',
            'gearItem:id,name,image_url,category,price_per_day,owner_id',
            'gearItems' => function ($q) use ($userId) {
                $q->where('gear_items.owner_id', $userId);
            },
        ]);

        return response()->json($booking);
    }

    /**
     * POST /api/my/gear-bookings/{booking}/confirm
     */
    public function confirm(Request $request, Booking $booking)
    {
        $this->authorizeHost($request, $booking);

        if ($booking->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending bookings can be confirmed.',
            ], 422);
        }

                $booking->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        NotificationService::notify(
            $booking->user_id,
            'gear.rental.confirmed',
            'Your rental was confirmed',
            "Rental #{$booking->id} is confirmed.",
            '/bookings',
        );

        return response()->json($booking->fresh());
    }

    /**
     * POST /api/my/gear-bookings/{booking}/complete
     */
    public function complete(Request $request, Booking $booking)
    {
        $this->authorizeHost($request, $booking);

        if ($booking->status !== 'confirmed') {
            return response()->json([
                'message' => 'Only confirmed bookings can be completed.',
            ], 422);
        }

                $booking->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        NotificationService::notify(
            $booking->user_id,
            'gear.rental.completed',
            'Rental marked complete',
            "Rental #{$booking->id} is complete. Leave a review!",
            '/bookings',
        );

        return response()->json($booking->fresh());
    }

    /**
     * POST /api/my/gear-bookings/{booking}/cancel
     */
    public function cancel(Request $request, Booking $booking)
    {
        $this->authorizeHost($request, $booking);

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Already cancelled.']);
        }

        if ($booking->status === 'completed') {
            return response()->json([
                'message' => 'Completed bookings cannot be cancelled.',
            ], 422);
        }

                $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        NotificationService::notify(
            $booking->user_id,
            'gear.rental.cancelled',
            'Rental was cancelled',
            "Rental #{$booking->id} was cancelled by the host.",
            '/bookings',
        );

        return response()->json($booking->fresh());
    }

    /**
     * Ensure the authenticated user owns the gear item this booking is for.
     */
    private function authorizeHost(Request $request, Booking $booking): void
    {
        $userId = $request->user()->id;
        $booking->loadMissing(['gearItem', 'gearItems']);

        // Legacy single-gear flow: booking.gear_item_id points at one gear item
        if ($booking->gearItem && $booking->gearItem->owner_id === $userId) {
            return;
        }

        // Multi-gear flow: check the pivot table for any line owned by this user
        if (
            $booking->gearItems->contains(
                fn ($item) => $item->owner_id === $userId,
            )
        ) {
            return;
        }

        abort(403, 'This booking is not for one of your gear items.');
    }
}