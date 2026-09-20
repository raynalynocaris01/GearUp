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
        $campsiteIds = $request->user()
            ->campsites()
            ->pluck('id');

        $bookings = Booking::with(['campsite', 'user:id,name,email'])
            ->whereIn('campsite_id', $campsiteIds)
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
        $ownsIt = $request->user()
            ->campsites()
            ->where('id', $booking->campsite_id)
            ->exists();

        if (! $ownsIt) {
            abort(403, 'This booking is not for one of your campsites.');
        }
    }
}