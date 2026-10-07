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
                  ->orWhere('created_by', $userId);
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
        $data['created_by'] = $request->user()->id;

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
        $data['created_by'] = $request->user()->id;

        $guide = TourGuide::create($data);

        return response()->json($guide, 201);
    }

    /**
     * PUT /api/owner/tour-guides/{tourGuide}
     * Update a guide the authenticated user owns.
     */
    public function update(Request $request, TourGuide $tourGuide)
    {
        $this->authorizeGuide($request, $tourGuide);

        $data = $request->validate($this->guideRules());

        $tourGuide->update($data);

        return response()->json($tourGuide->fresh('campsite'));
    }

    /**
     * DELETE /api/owner/tour-guides/{tourGuide}
     */
    public function destroy(Request $request, TourGuide $tourGuide)
    {
        $this->authorizeGuide($request, $tourGuide);

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

    /**
     * A guide is "owned" if:
     * - The user created it (created_by matches), OR
     * - It's attached to a campsite the user owns.
     */
    private function authorizeGuide(Request $request, TourGuide $tourGuide): void
    {
        $userId = $request->user()->id;

        if ($tourGuide->created_by === $userId) {
            return;
        }

        if ($tourGuide->campsite && $tourGuide->campsite->owner_id === $userId) {
            return;
        }

        abort(403, 'You do not own this tour guide.');
    }
}