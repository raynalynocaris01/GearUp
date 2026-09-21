<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    /**
     * GET /api/campsites/{campsite}/reviews
     * Public endpoint — anyone can read reviews.
     */
    public function index(Campsite $campsite)
    {
        $reviews = Review::with('user:id,name')
            ->where('campsite_id', $campsite->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($reviews);
    }

    /**
     * POST /api/campsites/{campsite}/reviews
     * Requires auth. Only customers with a completed booking can leave
     * a review — and only once per booking.
     */
    public function store(Request $request, Campsite $campsite)
    {
        $data = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $booking = Booking::findOrFail($data['booking_id']);

        // Booking must belong to this user
        if ($booking->user_id !== $user->id) {
            abort(403, 'This booking does not belong to you.');
        }

        // Booking must be for this campsite
        if ($booking->campsite_id !== $campsite->id) {
            abort(422, 'This booking is not for the selected campsite.');
        }

        // Booking must be completed
        if ($booking->status !== 'completed') {
            throw ValidationException::withMessages([
                'booking_id' => [
                    'You can only review campsites you have completed a stay at.',
                ],
            ]);
        }

        // One review per booking
        if (Review::where('booking_id', $booking->id)->exists()) {
            throw ValidationException::withMessages([
                'booking_id' => ['You already reviewed this stay.'],
            ]);
        }

        $review = Review::create([
            'user_id' => $user->id,
            'campsite_id' => $campsite->id,
            'booking_id' => $booking->id,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
        ]);

        $this->recalculateCampsiteRating($campsite);

        return response()->json($review->load('user:id,name'), 201);
    }

    /**
     * DELETE /api/reviews/{review}
     * Only the author can delete their review.
     */
    public function destroy(Request $request, Review $review)
    {
        if ($review->user_id !== $request->user()->id) {
            abort(403, 'You can only delete your own reviews.');
        }

        $campsite = $review->campsite;
        $review->delete();

        $this->recalculateCampsiteRating($campsite);

        return response()->json(['message' => 'Review deleted.']);
    }

    /**
     * Recompute the campsite's average rating and review count.
     */
    private function recalculateCampsiteRating(Campsite $campsite): void
    {
        $stats = Review::where('campsite_id', $campsite->id)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        $campsite->update([
            'rating' => round((float) ($stats->avg_rating ?? 0), 2),
            'reviews_count' => (int) ($stats->total ?? 0),
        ]);
    }
}