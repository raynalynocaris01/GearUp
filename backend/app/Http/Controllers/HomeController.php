<?php

namespace App\Http\Controllers;

use App\Models\Campsite;
use App\Models\Event;
use App\Models\GearItem;
use App\Models\TourGuide;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    /**
     * GET /api/home/recommended
     * Returns a mixed selection: top campsite, top gear, top guide, next upcoming event.
     * Query: ?limit=1 (per category, default 1)
     */
    public function recommended(Request $request)
    {
        $limit = min((int) $request->query('limit', 1), 5);
        if ($limit < 1) {
            $limit = 1;
        }

        // Top-rated featured campsites (fall back to top-rated any)
        $campsites = Campsite::with('owner:id,name')
            ->orderByDesc('is_featured')
            ->orderByDesc('rating')
            ->orderByDesc('reviews_count')
            ->limit($limit)
            ->get();

        // In-stock gear items, most recently added or by owner variety
        $gear = GearItem::with('owner:id,name')
            ->where('is_available', true)
            ->where('stock', '>', 0)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        // Tour guides (attached or independent) — pick a mix
        $guides = TourGuide::with('campsite:id,name,image_url')
            ->orderByDesc('is_independent')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        // Upcoming published events (ends_at in the future), soonest first
        $events = Event::with('owner:id,name')
            ->where('is_published', true)
            ->where('ends_at', '>=', now())
            ->orderBy('starts_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'campsites' => $campsites,
            'gear' => $gear,
            'guides' => $guides,
            'events' => $events,
        ]);
    }
}