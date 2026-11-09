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
        // Public listing — only approved (or legacy) guides.
        $query = TourGuide::with([
            'campsite:id,name,location,image_url,owner_id',
            'user:id,avatar_url',
        ])->approved();

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
     * Public — 404 for non-approved guides unless the requester is
     * the guide's owner, the admin, or the guide themselves.
     */
    public function show(Request $request, TourGuide $tourGuide)
    {
        $isApproved = in_array($tourGuide->approval_status, ['approved', 'legacy'], true);

        if (! $isApproved) {
            $viewer = $request->user();
            $allowed = false;

            if ($viewer) {
                if ($viewer->role === 'admin') {
                    $allowed = true;
                } elseif ($tourGuide->created_by === $viewer->id
                    || $tourGuide->user_id === $viewer->id
                    || ($tourGuide->campsite && $tourGuide->campsite->owner_id === $viewer->id)
                ) {
                    $allowed = true;
                }
            }

            if (! $allowed) {
                abort(404, 'Tour guide not found.');
            }
        }

        return response()->json(
            $tourGuide->load([
                'campsite:id,name,location,image_url,owner_id',
                'user:id,avatar_url'
            ])
        );
    }
}