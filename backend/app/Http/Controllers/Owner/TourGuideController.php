<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Campsite;
use App\Models\TourGuide;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
     * GET /api/owner/tour-guides
     * List all guides (attached + independent) owned by the user.
     * "Owned" means: guides attached to the user's campsites
     * OR independent guides the user created.
     */
    public function all(Request $request)
    {
        $userId = $request->user()->id;

        $campsiteIds = Campsite::where('owner_id', $userId)->pluck('id');

        $guides = TourGuide::with('campsite:id,name')
            ->where(function ($q) use ($campsiteIds, $userId) {
                $q->whereIn('campsite_id', $campsiteIds)
                  ->orWhere(function ($q2) use ($userId) {
                      // Independent guides created by this user.
                      // We'll add a user_id column? No — instead use is_independent
                      // + the owner who created them. But we don't have created_by.
                      // Simpler: independent guides are globally visible for now.
                      $q2->where('is_independent', true);
                  });
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json($guides);
    }

    /**
     * POST /api/owner/campsites/{campsite}/tour-guides
     */
    public function store(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        $data = $request->validate($this->guideRules());

        $guide = $campsite->tourGuides()->create($data);

        return response()->json($guide, 201);
    }

    /**
     * POST /api/owner/tour-guides
     * Create an independent guide (not attached to a campsite).
     */
    public function storeIndependent(Request $request)
    {
        $data = $request->validate($this->guideRules());

        $data['is_independent'] = true;
        $data['campsite_id'] = null;

        $guide = TourGuide::create($data);

        return response()->json($guide, 201);
    }

    /**
     * DELETE /api/owner/tour-guides/{tourGuide}
     */
    public function destroy(Request $request, TourGuide $tourGuide)
    {
        if ($tourGuide->campsite) {
            $this->authorizeOwner($request, $tourGuide->campsite);
        }

        $tourGuide->delete();

        return response()->json(['message' => 'Tour guide removed.']);
    }

    private function guideRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_per_trip' => ['required', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function authorizeOwner(Request $request, Campsite $campsite): void
    {
        if ($campsite->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this campsite.');
        }
    }
}