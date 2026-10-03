<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * GET /api/admin/reviews
     * All reviews platform-wide, newest first.
     * Optional: ?rating=N (1-5), ?campsite_id=X, ?limit=N (default 100, max 500)
     */
    public function index(Request $request)
    {
        $query = Review::with([
            'user:id,name,email',
            'campsite:id,name,image_url,owner_id',
            'campsite.owner:id,name,email',
        ]);

        if ($rating = $request->query('rating')) {
            $query->where('rating', (int) $rating);
        }

        if ($campsiteId = $request->query('campsite_id')) {
            $query->where('campsite_id', (int) $campsiteId);
        }

        $limit = (int) $request->query('limit', 100);
        if ($limit < 1) $limit = 100;
        if ($limit > 500) $limit = 500;

        $reviews = $query->orderByDesc('created_at')->limit($limit)->get();

        return response()->json($reviews);
    }
}