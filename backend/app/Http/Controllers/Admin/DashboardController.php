<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Campsite;
use App\Models\User;

class DashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard
     * Platform-wide metrics.
     */
    public function index()
    {
        $totalUsers = User::count();
        $totalOwners = User::where('role', 'owner')->count();
        $pendingOwners = User::where('role', 'owner')
            ->where('is_approved', false)
            ->count();
        $suspendedUsers = User::where('is_suspended', true)->count();

        $totalCampsites = Campsite::count();
        $featuredCampsites = Campsite::where('is_featured', true)->count();

        $totalBookings = Booking::count();
        $pendingBookings = Booking::where('status', 'pending')->count();
        $confirmedBookings = Booking::where('status', 'confirmed')->count();

        $totalRevenue = Booking::where('status', 'confirmed')->sum('total_price');

        return response()->json([
            'total_users' => $totalUsers,
            'total_owners' => $totalOwners,
            'pending_owners' => $pendingOwners,
            'suspended_users' => $suspendedUsers,
            'total_campsites' => $totalCampsites,
            'featured_campsites' => $featuredCampsites,
            'total_bookings' => $totalBookings,
            'pending_bookings' => $pendingBookings,
            'confirmed_bookings' => $confirmedBookings,
            'total_revenue' => (float) $totalRevenue,
        ]);
    }
}