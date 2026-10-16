<?php

namespace App\Http\Controllers;

use App\Models\Campsite;
use Illuminate\Http\Request;

class CampsiteController extends Controller
{
    /**
     * GET /api/campsites
     * Optional query: ?featured=1 to filter featured only.
     */
    public function index(Request $request)
    {
        // Exclude sub-listings (e.g. rooms) from the top-level browse list.
        // They are still reachable at /campsites/{id} and shown on the
        // parent campsite's detail page.
        $query = Campsite::query()->whereNull('parent_campsite_id');

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        return response()->json(
            $query->orderByDesc('rating')->get()
        );
    }

    /**
     * GET /api/campsites/{campsite}
     */
    public function show(Campsite $campsite)
    {
        $campsite->load([
            'tourGuides',
            'children',
            'parent:id,name',
            'reviews' => function ($q) {
                $q->with('user:id,name')->orderByDesc('created_at');
            },
        ]);

        return response()->json($campsite);
    }
}