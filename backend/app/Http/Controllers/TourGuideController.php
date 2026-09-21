<?php

namespace App\Http\Controllers;

use App\Models\TourGuide;
use Illuminate\Http\Request;

class TourGuideController extends Controller
{
    /**
     * GET /api/tour-guides
     * Returns all guides, grouped conceptually by campsite.
     * Includes campsite info so the client can display "attached to X".
     */
    public function index(Request $request)
    {
        $query = TourGuide::with('campsite:id,name,location,image_url,owner_id');

        if ($request->boolean('independent')) {
            $query->where('is_independent', true);
        }

        if ($request->filled('campsite_id')) {
            $query->where('campsite_id', $request->integer('campsite_id'));
        }

        $guides = $query->orderByDesc('created_at')->get();

        return response()->json($guides);
    }

    /**
     * GET /api/tour-guides/{tourGuide}
     */
    public function show(TourGuide $tourGuide)
    {
        return response()->json(
            $tourGuide->load('campsite:id,name,location,image_url,owner_id')
        );
    }
}