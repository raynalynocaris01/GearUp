<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TourGuide;
use Illuminate\Http\Request;

class TourGuideController extends Controller
{
    /**
     * GET /api/admin/tour-guides
     * List all tour guides platform-wide.
     * Optional: ?independent=true|false
     */
    public function index(Request $request)
    {
        $query = TourGuide::with([
            'campsite:id,name,location,image_url',
            'creator:id,name,email',
        ]);

        if ($request->filled('independent')) {
            $query->where(
                'is_independent',
                $request->boolean('independent'),
            );
        }

        $guides = $query->orderByDesc('created_at')->get();

        return response()->json($guides);
    }

    /**
     * POST /api/admin/tour-guides
     * Create a tour guide. Admin can create either an independent guide
     * or attach one to a specific campsite.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_per_trip' => ['required', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'campsite_id' => ['nullable', 'integer', 'exists:campsites,id'],
        ]);

        $data['is_independent'] = empty($data['campsite_id']);
        $data['created_by'] = $request->user()->id;

        $guide = TourGuide::create($data);

        return response()->json(
            $guide->load(['campsite:id,name,location,image_url', 'creator:id,name,email']),
            201,
        );
    }

    /**
     * PUT /api/admin/tour-guides/{tourGuide}
     */
    public function update(Request $request, TourGuide $tourGuide)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'contact_number' => ['sometimes', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_per_trip' => ['sometimes', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'campsite_id' => ['nullable', 'integer', 'exists:campsites,id'],
        ]);

        // If campsite_id is being changed, keep is_independent in sync
        if (array_key_exists('campsite_id', $data)) {
            $data['is_independent'] = empty($data['campsite_id']);
        }

        $tourGuide->update($data);

        return response()->json(
            $tourGuide->fresh(['campsite:id,name,location,image_url', 'creator:id,name,email']),
        );
    }

    /**
     * DELETE /api/admin/tour-guides/{tourGuide}
     */
    public function destroy(TourGuide $tourGuide)
    {
        $tourGuide->delete();

        return response()->json(['message' => 'Tour guide removed.']);
    }
}