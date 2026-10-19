<?php

namespace App\Http\Controllers\Guide;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * GET /api/guide/bookings
     * Bookings assigned to the authenticated guide.
     */
    public function index(Request $request)
    {
        $guideId = $request->user()->id;

        $bookings = Booking::with([
            'campsite',
            'roomCampsite',
            'gearItem',
            'gearItems',
            'user:id,name,email',
        ])
            ->whereHas('tourGuide', function ($q) use ($guideId) {
                $q->where('user_id', $guideId);
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json($bookings);
    }

    /**
     * GET /api/guide/bookings/{booking}
     */
    public function show(Request $request, Booking $booking)
    {
        $this->authorizeGuide($request, $booking);

        return response()->json(
            $booking->load([
                'campsite',
                'roomCampsite',
                'gearItem',
                'gearItems',
                'tourGuide',
                'user:id,name,email',
            ])
        );
    }

    /**
     * PUT /api/guide/bookings/{booking}/accept
     */
    public function accept(Request $request, Booking $booking)
    {
        $this->authorizeGuide($request, $booking);

        if ($booking->guide_status === 'accepted') {
            return response()->json([
                'message' => 'This booking is already accepted.',
            ], 422);
        }

        if ($booking->guide_status === 'declined') {
            return response()->json([
                'message' => 'This booking has already been declined.',
            ], 422);
        }

        $booking->update(['guide_status' => 'accepted']);

        NotificationService::notify(
            $booking->user_id,
            'booking.guide_accepted',
            'Your tour guide confirmed',
            "Booking #{$booking->id} — your guide is ready.",
            "/bookings/{$booking->id}",
        );

        return response()->json($booking->fresh());
    }

    /**
     * PUT /api/guide/bookings/{booking}/decline
     */
    public function decline(Request $request, Booking $booking)
    {
        $this->authorizeGuide($request, $booking);

        if ($booking->guide_status === 'accepted') {
            return response()->json([
                'message' => 'This booking has already been accepted.',
            ], 422);
        }

        if ($booking->guide_status === 'declined') {
            return response()->json([
                'message' => 'This booking has already been declined.',
            ], 422);
        }

        $booking->update(['guide_status' => 'declined']);

        NotificationService::notify(
            $booking->user_id,
            'booking.guide_declined',
            'Your tour guide could not make it',
            "Booking #{$booking->id} — please contact support to arrange an alternative.",
            "/bookings/{$booking->id}",
        );

        return response()->json($booking->fresh());
    }

    private function authorizeGuide(Request $request, Booking $booking): void
    {
        $booking->loadMissing('tourGuide');

        if (! $booking->tourGuide || $booking->tourGuide->user_id !== $request->user()->id) {
            abort(403, 'This booking is not assigned to you.');
        }
    }
}