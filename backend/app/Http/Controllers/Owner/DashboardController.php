<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * GET /api/owner/dashboard
     * Returns summary stats for the owner's dashboard.
     */
    public function index(Request $request)
    {
        $owner = $request->user();
        $campsiteIds = $owner->campsites()->pluck('id');

        $totalCampsites = $campsiteIds->count();

        $totalBookings = Booking::whereIn('campsite_id', $campsiteIds)
            ->count();

        $pendingBookings = Booking::whereIn('campsite_id', $campsiteIds)
            ->where('status', 'pending')
            ->count();

        $confirmedBookings = Booking::whereIn('campsite_id', $campsiteIds)
            ->where('status', 'confirmed')
            ->count();

        $totalRevenue = Booking::whereIn('campsite_id', $campsiteIds)
            ->where('status', 'confirmed')
            ->sum('total_price');

        return response()->json([
            'total_campsites' => $totalCampsites,
            'total_bookings' => $totalBookings,
            'pending_bookings' => $pendingBookings,
            'confirmed_bookings' => $confirmedBookings,
            'total_revenue' => (float) $totalRevenue,
        ]);
    }
}