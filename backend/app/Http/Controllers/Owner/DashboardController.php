<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Carbon\Carbon;
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

        $completedBookings = Booking::whereIn('campsite_id', $campsiteIds)
            ->where('status', 'completed')
            ->count();

        $totalRevenue = Booking::whereIn('campsite_id', $campsiteIds)
            ->whereIn('status', ['confirmed', 'completed'])
            ->sum('total_price');

        // Average rating across all reviews for this owner's campsites
        $averageRating = \App\Models\Review::whereIn('campsite_id', $campsiteIds)
            ->avg('rating');

        $totalReviews = \App\Models\Review::whereIn('campsite_id', $campsiteIds)
            ->count();

        return response()->json([
            'total_campsites' => $totalCampsites,
            'total_bookings' => $totalBookings,
            'pending_bookings' => $pendingBookings,
            'confirmed_bookings' => $confirmedBookings,
            'completed_bookings' => $completedBookings,
            'average_rating' => $averageRating !== null
                ? round((float) $averageRating, 2)
                : 0,
            'total_revenue' => (float) $totalRevenue,
            'total_earnings' => (float) $totalRevenue,
        ]);
    }

    /**
     * GET /api/owner/dashboard/chart?days=30
     * Returns daily booking counts over the last N days (default 30).
     * Bucketed by booking created_at date. Zero-filled for missing days.
     */
    public function chart(Request $request)
    {
        $owner = $request->user();
        $campsiteIds = $owner->campsites()->pluck('id');

        // Clamp days between 7 and 90 to keep payloads sane
        $days = (int) $request->query('days', 30);
        if ($days < 7) {
            $days = 7;
        }
        if ($days > 90) {
            $days = 90;
        }

        $start = Carbon::today()->subDays($days - 1)->startOfDay();
        $end = Carbon::today()->endOfDay();

        // Pull raw rows once, bucket in PHP. Avoids DB-specific date funcs.
        $rows = Booking::whereIn('campsite_id', $campsiteIds)
            ->whereBetween('created_at', [$start, $end])
            ->get(['created_at', 'status']);

        // Pre-fill every day in range with zero
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