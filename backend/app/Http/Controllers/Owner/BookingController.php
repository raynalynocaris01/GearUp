<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
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

        $bookings = Booking::with(['campsite', 'tourGuide', 'gearItem', 'user:id,name,email'])
            ->where(function ($q) use ($campsiteIds, $gearItemIds) {
                $q->whereIn('campsite_id', $campsiteIds)
                ->orWhereIn('gear_item_id', $gearItemIds);
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json($bookings);
    }

    /**
     * POST /api/owner/bookings/{booking}/confirm
     * Owner can confirm a pending booking (future: booking lifecycle).
     */
    public function confirm(Request $request, Booking $booking)
    {
        $this->authorizeOwner($request, $booking);

        $booking->update(['status' => 'confirmed']);

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

        $booking->update(['status' => 'completed']);

        return response()->json($booking->load('campsite'));
    }
    /**
     * POST /api/owner/bookings/{booking}/cancel
     */
    public function cancel(Request $request, Booking $booking)
    {
        $this->authorizeOwner($request, $booking);

        $booking->update(['status' => 'cancelled']);

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