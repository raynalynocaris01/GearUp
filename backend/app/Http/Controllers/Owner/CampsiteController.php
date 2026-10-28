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
            ->when($request->boolean('parents_only'), fn ($q) => $q->whereNull('parent_campsite_id'))
            ->with('tourGuides')
            ->withCount('bookings')
            ->withSum(['bookings as revenue' => function ($query) {
                $query->whereIn('status', ['confirmed', 'completed']);
            }], 'total_price')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Campsite $campsite) {
                $campsite->setAttribute(
                    'revenue',
                    (float) ($campsite->revenue ?? 0),
                );
                return $campsite;
            });

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
            'image_url' => ['required', 'string', 'max:2048'],
            'capacity' => ['required', 'integer', 'min:1'],
            'payment_mode' => ['nullable', 'string', 'in:online,pay_at_campsite'],
            'is_available' => ['sometimes', 'boolean'],
            'pricing_mode' => ['sometimes', 'in:simple,detailed'],
            'parent_campsite_id' => ['nullable', 'integer', 'exists:campsites,id'],
            'free_items' => ['nullable', 'array'],
            'free_items.*' => ['string', 'max:255'],
        ]);

        // If creating a room variant, verify the parent belongs to this owner
        if (!empty($data['parent_campsite_id'])) {
            $parent = Campsite::findOrFail($data['parent_campsite_id']);
            if ($parent->owner_id !== $request->user()->id) {
                abort(403, 'You do not own the parent campsite.');
            }
        }

        $campsite = Campsite::create([
            'owner_id' => $request->user()->id,
            'parent_campsite_id' => $data['parent_campsite_id'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'],
            'location' => $data['location'],
            'region' => $data['region'],
            'price_per_night' => $data['price_per_night'],
            'price_unit' => $data['price_unit'],
            'image_url' => $data['image_url'],
            'capacity' => $data['capacity'],
            'pricing_mode' => $data['pricing_mode'] ?? 'simple',
            'payment_mode' => $data['payment_mode'] ?? 'online',
            'rating' => 0,
            'free_items' => $data['free_items'] ?? [],
            'reviews_count' => 0,
            'is_featured' => false,
        ]);

        return response()->json($campsite, 201);
    }

    public function show(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        return response()->json(
            $campsite->load(['tourGuides', 'children', 'pricingLines'])
        );
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
            'image_url' => ['sometimes', 'string', 'max:2048'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
            'is_available' => ['sometimes', 'boolean'],
            'pricing_mode' => ['sometimes', 'in:simple,detailed'],
            'payment_mode' => ['sometimes', 'in:online,pay_at_campsite'],
            'free_items' => ['nullable', 'array'],
            'free_items.*' => ['string', 'max:255'],
        ]);

        $campsite->update($data);

        return response()->json($campsite->fresh('tourGuides'));
    }

    public function destroy(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        // Safety: block deletion if this campsite or any of its rooms
        // have active/any bookings. FK constraints would also block this,
        // but a clear message is better than a DB error.
        $bookingCount = \App\Models\Booking::where('campsite_id', $campsite->id)
            ->orWhereIn('campsite_id', $campsite->children()->pluck('id'))
            ->count();

        if ($bookingCount > 0) {
            return response()->json([
                'message' => 'This campsite has existing bookings and cannot be deleted.',
            ], 422);
        }

        $campsite->delete();

        return response()->json(['message' => 'Campsite deleted.']);
    }
    /**
 * POST /api/owner/campsites/{campsite}/image
 * Accepts a single image file and replaces the campsite's image.
 */
public function uploadImage(Request $request, Campsite $campsite)
{
    $this->authorizeOwner($request, $campsite);

    $request->validate([
        'image' => [
            'required',
            'file',
            'image',
            'mimes:jpg,jpeg,png,webp',
            'max:2048', // 2 MB
        ],
    ]);

    // Delete the old file if it was a local storage upload
    $oldUrl = $campsite->image_url;
    if ($oldUrl && str_contains($oldUrl, '/storage/campsites/')) {
        $oldPath = 'campsites/' . basename($oldUrl);
        if (\Storage::disk('public')->exists($oldPath)) {
            \Storage::disk('public')->delete($oldPath);
        }
    }

    // Store the new file
    $file = $request->file('image');
    $extension = $file->getClientOriginalExtension();
    $filename = 'campsite-' . $campsite->id . '-' . time() . '.' . $extension;

    $file->storeAs('campsites', $filename, 'public');

    // Store a relative path so it's host-agnostic. The frontend
    // prepends the API base URL when rendering.
    $url = '/storage/campsites/' . $filename;

    $campsite->update(['image_url' => $url]);

    return response()->json([
        'message' => 'Image uploaded.',
        'image_url' => $url,
        'campsite' => $campsite->fresh(),
    ]);
}

    private function authorizeOwner(Request $request, Campsite $campsite): void
    {
        if ($campsite->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this campsite.');
        }
    }
}