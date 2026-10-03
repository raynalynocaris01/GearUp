<?php

namespace App\Http\Controllers\My;

use App\Http\Controllers\Controller;
use App\Models\Booking;
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
}