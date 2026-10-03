<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Campsite;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

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
        $completedBookings = Booking::where('status', 'completed')->count();

        $totalRevenue = Booking::whereIn('status', ['confirmed', 'completed'])->sum('total_price');

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
            'completed_bookings' => $completedBookings,
                        'total_revenue' => (float) $totalRevenue,
        ]);
    }

    /**
     * GET /api/admin/dashboard/chart?days=30
     * Platform-wide daily booking counts, bucketed by created_at.
     */
    public function chart(Request $request)
    {
        $days = (int) $request->query('days', 30);
        if ($days < 7) {
            $days = 7;
        }
        if ($days > 90) {
            $days = 90;
        }

        $start = Carbon::today()->subDays($days - 1)->startOfDay();
        $end = Carbon::today()->endOfDay();

        $rows = Booking::whereBetween('created_at', [$start, $end])
            ->get(['created_at', 'status']);

        $buckets = [];
        for ($i = 0; $i < $days; $i++) {
            $key = $start->copy()->addDays($i)->toDateString();
            $buckets[$key] = [
                'total' => 0,
                'confirmed' => 0,
                'pending' => 0,
            ];
        }

        foreach ($rows as $row) {
            $key = $row->created_at->toDateString();
            if (!isset($buckets[$key])) {
                continue;
            }
            $buckets[$key]['total']++;
            if ($row->status === 'confirmed') {
                $buckets[$key]['confirmed']++;
            }
            if ($row->status === 'pending') {
                $buckets[$key]['pending']++;
            }
        }

        $labels = [];
        $total = [];
        $confirmed = [];
        $pending = [];

        foreach ($buckets as $dateStr => $counts) {
            $labels[] = Carbon::parse($dateStr)->format('M j');
            $total[] = $counts['total'];
            $confirmed[] = $counts['confirmed'];
            $pending[] = $counts['pending'];
        }

        return response()->json([
            'days' => $days,
            'labels' => $labels,
            'total' => $total,
            'confirmed' => $confirmed,
            'pending' => $pending,
        ]);
    }
}