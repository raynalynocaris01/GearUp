<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Campsite;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /**
     * GET /api/bookings
     * Returns the authenticated user's bookings.
     */
    public function index(Request $request)
    {
        return response()->json(
        Booking::with(['campsite', 'review'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('check_in')
            ->get()
    );
    }

    /**
     * POST /api/bookings
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'campsite_id' => ['required', 'integer', 'exists:campsites,id'],
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'guests' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $campsite = Campsite::findOrFail($data['campsite_id']);

        // Guest count vs. capacity
        if ($data['guests'] > $campsite->capacity) {
            throw ValidationException::withMessages([
                'guests' => [
                    "This campsite allows a maximum of {$campsite->capacity} guests.",
                ],
            ]);
        }

        // Overlap check — any existing booking with the same campsite whose
        // dates overlap with the requested range.
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

        // Price calculation
        $checkIn = Carbon::parse($data['check_in']);
        $checkOut = Carbon::parse($data['check_out']);
        $nights = max(1, $checkIn->diffInDays($checkOut));

        // If the campsite's price_unit is "night", multiply by nights;
        // if "entrance", treat as flat entry fee per guest.
        $totalPrice = $campsite->price_unit === 'entrance'
            ? $campsite->price_per_night * $data['guests']
            : $campsite->price_per_night * $nights * $data['guests'];

        $booking = Booking::create([
            'user_id' => $request->user()->id,
            'campsite_id' => $campsite->id,
            'check_in' => $data['check_in'],
            'check_out' => $data['check_out'],
            'guests' => $data['guests'],
            'total_price' => $totalPrice,
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(
            $booking->load('campsite'),
            201
        );
    }

    /**
     * GET /api/bookings/{booking}
     */
    public function show(Request $request, Booking $booking)
    {
        // Only the owner can view
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }

        return response()->json($booking->load('campsite'));
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

        return response()->json($booking->load('campsite'));
    }
}