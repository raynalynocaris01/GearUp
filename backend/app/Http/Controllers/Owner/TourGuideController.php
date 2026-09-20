<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Campsite;
use App\Models\TourGuide;
use Illuminate\Http\Request;

class TourGuideController extends Controller
{
    /**
     * GET /api/owner/campsites/{campsite}/tour-guides
     */
    public function index(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        return response()->json($campsite->tourGuides()->get());
    }

    /**
     * POST /api/owner/campsites/{campsite}/tour-guides
     */
    public function store(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $guide = $campsite->tourGuides()->create($data);

        return response()->json($guide, 201);
    }

    /**
     * DELETE /api/owner/tour-guides/{tourGuide}
     */
    public function destroy(Request $request, TourGuide $tourGuide)
    {
        $campsite = $tourGuide->campsite;
        $this->authorizeOwner($request, $campsite);

        $tourGuide->delete();

        return response()->json(['message' => 'Tour guide removed.']);
    }

    private function authorizeOwner(Request $request, Campsite $campsite): void
    {
        if ($campsite->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this campsite.');
        }
    }
}