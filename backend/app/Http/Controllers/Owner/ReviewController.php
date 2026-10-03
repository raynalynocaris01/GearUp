<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * GET /api/owner/reviews
     * Returns the newest reviews across the owner's campsites.
     * Optional query: ?limit=N (default 3, max 50)
     */
    public function index(Request $request)
    {
        $owner = $request->user();
        $campsiteIds = $owner->campsites()->pluck('id');

            $limit = (int) $request->query('limit', 3);
        if ($limit < 1) {
            $limit = 3;
        }
        if ($limit > 200) {
            $limit = 200;
        }

        $reviews = Review::whereIn('campsite_id', $campsiteIds)
            ->with([
                'user:id,name',
                'campsite:id,name,image_url',
            ])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return response()->json($reviews);
    }
}