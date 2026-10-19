<?php

namespace App\Http\Controllers\Guide;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * GET /api/guide/profile
     */
    public function show(Request $request)
    {
        $profile = $request->user()->guideProfile;

        if (! $profile) {
            return response()->json([
                'message' => 'Guide profile not found.',
            ], 404);
        }

        return response()->json($profile);
    }

    /**
     * PUT /api/guide/profile
     */
    public function update(Request $request)
    {
        $profile = $request->user()->guideProfile;

        if (! $profile) {
            return response()->json([
                'message' => 'Guide profile not found.',
            ], 404);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'contact_number' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'price_per_trip' => ['sometimes', 'numeric', 'min:0'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'campsite_id' => ['sometimes', 'nullable', 'integer', 'exists:campsites,id'],
        ]);

        // Recompute is_independent based on campsite attachment
        if (array_key_exists('campsite_id', $data)) {
            $data['is_independent'] = $data['campsite_id'] === null;
        }

        $profile->update($data);

        return response()->json($profile->fresh());
    }
}