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
        // Public campsite detail — only approved guides are shown.
        // We load them via the scoped relation, then alias them back
        // to `tourGuides` so the response shape stays `tour_guides`
        // (existing clients don't break).
        $campsite->load([
            'approvedTourGuides',
            'children',
            'parent:id,name',
            'pricingLines',
            'photos',
            'reviews' => function ($q) {
                $q->with('user:id,name')->orderByDesc('created_at');
            },
        ]);

        // Alias back to `tourGuides` so the response key is unchanged.
        $campsite->setRelation('tourGuides', $campsite->approvedTourGuides);
        $campsite->unsetRelation('approvedTourGuides');

        return response()->json($campsite);
    }
}