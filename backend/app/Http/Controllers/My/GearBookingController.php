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
            'gearItem:id,name,image_url,category,price_per_day,owner_id',
        ])
            ->whereHas('gearItem', function ($q) use ($userId) {
                $q->where('owner_id', $userId);
            });

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $bookings = $query->orderByDesc('created_at')->get();

        return response()->json($bookings);
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

        $booking->update(['status' => 'confirmed']);

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

        $booking->update(['status' => 'completed']);

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

        $booking->update(['status' => 'cancelled']);

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
        $booking->loadMissing('gearItem');

        if (!$booking->gearItem) {
            abort(404, 'This booking is not for a gear item.');
        }

        if ($booking->gearItem->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this gear item.');
        }
    }
}