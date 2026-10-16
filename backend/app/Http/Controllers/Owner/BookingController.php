<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * GET /api/owner/bookings
     * Bookings on campsites owned by the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $campsiteIds = $user->campsites()->pluck('id');
        $gearItemIds = $user->gearItems()->pluck('id');
        $userId = $user->id;

        $bookings = Booking::with([
            'campsite',
            'tourGuide',
            'gearItem',
            'user:id,name,email',
            'gearItems' => function ($q) use ($userId) {
                // Only eager-load the campsite owner's own gear lines
                $q->where('gear_items.owner_id', $userId);
            },
        ])
            ->where(function ($q) use ($campsiteIds, $gearItemIds) {
                $q->whereIn('campsite_id', $campsiteIds)
                ->orWhereIn('gear_item_id', $gearItemIds);
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json($bookings);
    }

    /**
     * GET /api/owner/bookings/{booking}
     * Single booking scoped to the authenticated owner. Gear lines are
     * filtered to only the owner's own items, matching the index method.
     */
    public function show(Request $request, Booking $booking)
    {
        $this->authorizeOwner($request, $booking);

        $userId = $request->user()->id;

        $booking->load([
            'campsite',
            'tourGuide',
            'gearItem',
            'user:id,name,email',
            'gearItems' => function ($q) use ($userId) {
                $q->where('gear_items.owner_id', $userId);
            },
        ]);

        return response()->json($booking);
    }

    /**
     * POST /api/owner/bookings/{booking}/confirm
     * Owner can confirm a pending booking (future: booking lifecycle).
     */
    public function confirm(Request $request, Booking $booking)
    {
        $this->authorizeOwner($request, $booking);

        $booking->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        NotificationService::notify(
            $booking->user_id,
            'booking.confirmed',
            'Your booking was confirmed',
            "Booking #{$booking->id} is confirmed.",
            '/bookings',
        );

        return response()->json($booking->load('campsite'));
    }
    /**
     * POST /api/owner/bookings/{booking}/complete
     * Mark a booking as completed after the stay.
     */
    public function complete(Request $request, Booking $booking)
    {
        $this->authorizeOwner($request, $booking);

        if ($booking->status !== 'confirmed') {
            abort(422, 'Only confirmed bookings can be marked as completed.');
        }

        $booking->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        NotificationService::notify(
            $booking->user_id,
            'booking.completed',
            'Your booking is complete',
            "Booking #{$booking->id} is marked complete. Leave a review!",
            '/bookings',
        );

        return response()->json($booking->load('campsite'));
    }
    /**
     * POST /api/owner/bookings/{booking}/cancel
     */
    public function cancel(Request $request, Booking $booking)
    {
        $this->authorizeOwner($request, $booking);

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        NotificationService::notify(
            $booking->user_id,
            'booking.cancelled',
            'Your booking was cancelled',
            "Booking #{$booking->id} has been cancelled by the host.",
            '/bookings',
        );

        return response()->json($booking->load('campsite'));
    }

    private function authorizeOwner(Request $request, Booking $booking): void
    {
        $user = $request->user();

        $ownsCampsite = $booking->campsite_id
            && $user->campsites()->where('id', $booking->campsite_id)->exists();

        $ownsGear = $booking->gear_item_id
            && $user->gearItems()->where('id', $booking->gear_item_id)->exists();

        if (! $ownsCampsite && ! $ownsGear) {
            abort(403, 'This booking is not for one of your listings.');
        }
    }
}