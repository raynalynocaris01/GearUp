<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Campsite;
use Illuminate\Http\Request;

class CampsiteController extends Controller
{
    public function index(Request $request)
    {
        $campsites = Campsite::where('owner_id', $request->user()->id)
            ->with('tourGuides')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($campsites);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'location' => ['required', 'string', 'max:255'],
            'region' => ['required', 'string', 'max:255'],
            'price_per_night' => ['required', 'numeric', 'min:0'],
            'price_unit' => ['required', 'in:night,entrance'],
            'image_url' => ['required', 'url'],
            'capacity' => ['required', 'integer', 'min:1'],
        ]);

        $campsite = Campsite::create([
            'owner_id' => $request->user()->id,
            'name' => $data['name'],
            'description' => $data['description'],
            'location' => $data['location'],
            'region' => $data['region'],
            'price_per_night' => $data['price_per_night'],
            'price_unit' => $data['price_unit'],
            'image_url' => $data['image_url'],
            'capacity' => $data['capacity'],
            'rating' => 0,
            'reviews_count' => 0,
            'is_featured' => false,
        ]);

        return response()->json($campsite, 201);
    }

    public function show(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        return response()->json($campsite->load('tourGuides'));
    }

    public function update(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'location' => ['sometimes', 'string', 'max:255'],
            'region' => ['sometimes', 'string', 'max:255'],
            'price_per_night' => ['sometimes', 'numeric', 'min:0'],
            'price_unit' => ['sometimes', 'in:night,entrance'],
            'image_url' => ['sometimes', 'url'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
        ]);

        $campsite->update($data);

        return response()->json($campsite->fresh('tourGuides'));
    }

    public function destroy(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        $campsite->delete();

        return response()->json(['message' => 'Campsite deleted.']);
    }

    private function authorizeOwner(Request $request, Campsite $campsite): void
    {
        if ($campsite->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this campsite.');
        }
    }
}