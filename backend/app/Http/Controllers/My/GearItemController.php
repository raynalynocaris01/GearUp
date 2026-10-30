<?php

namespace App\Http\Controllers\My;

use App\Http\Controllers\Controller;
use App\Models\GearItem;
use Illuminate\Http\Request;

class GearItemController extends Controller
{
    /**
     * GET /api/my/gear
     * List the authenticated user's gear listings.
     */
    public function index(Request $request)
    {
        $items = GearItem::where('owner_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($items);
    }

    /**
     * POST /api/my/gear
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'price_per_day' => ['required', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'stock' => ['required', 'integer', 'min:1'],
            'is_available' => ['sometimes', 'boolean'],
            'pickup_method' => ['sometimes', 'in:meetup,pickup,deliver,all'],
            'pickup_address' => ['nullable', 'string', 'max:1000'],
            'pickup_landmark' => ['nullable', 'string', 'max:255'],
            'pickup_hours' => ['nullable', 'string', 'max:255'],
            'pickup_instructions' => ['nullable', 'string', 'max:1000'],
            'contact_number' => ['nullable', 'string', 'max:30'],
        ]);

        $method = $data['pickup_method'] ?? 'meetup';
        // Only require an address when the customer must travel to the owner's place.
        // Meet-up without a location is allowed — the card will say
        // "Contact the owner to arrange a meet-up".
        if (in_array($method, ['pickup', 'all'], true) && empty($data['pickup_address'])) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'pickup_address' => 'Please enter the pickup address so renters can find you.',
            ]);
        }

        $item = GearItem::create([
            'owner_id' => $request->user()->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? '',
            'category' => $data['category'],
            'price_per_day' => $data['price_per_day'],
            'image_url' => $data['image_url'] ?? '',
            'stock' => $data['stock'],
            'is_available' => $data['is_available'] ?? true,
            'pickup_method' => $method,
            'pickup_address' => $data['pickup_address'] ?? null,
            'pickup_landmark' => $data['pickup_landmark'] ?? null,
            'pickup_hours' => $data['pickup_hours'] ?? null,
            'pickup_instructions' => $data['pickup_instructions'] ?? null,
            'contact_number' => $data['contact_number'] ?? null,
        ]);

        return response()->json($item, 201);
    }

    /**
     * GET /api/my/gear/{gearItem}
     */
    public function show(Request $request, GearItem $gearItem)
    {
        $this->authorizeOwn($request, $gearItem);

        return response()->json($gearItem);
    }

    /**
     * PUT /api/my/gear/{gearItem}
     */
    public function update(Request $request, GearItem $gearItem)
    {
        $this->authorizeOwn($request, $gearItem);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'max:100'],
            'price_per_day' => ['sometimes', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'stock' => ['sometimes', 'integer', 'min:1'],
            'is_available' => ['sometimes', 'boolean'],
            'pickup_method' => ['sometimes', 'in:meetup,pickup,deliver,all'],
            'pickup_address' => ['nullable', 'string', 'max:1000'],
            'pickup_landmark' => ['nullable', 'string', 'max:255'],
            'pickup_hours' => ['nullable', 'string', 'max:255'],
            'pickup_instructions' => ['nullable', 'string', 'max:1000'],
            'contact_number' => ['nullable', 'string', 'max:30'],
        ]);

        // Coerce nullable fields to empty strings to satisfy NOT NULL columns
        if (array_key_exists('description', $data) && $data['description'] === null) {
            $data['description'] = '';
        }
        if (array_key_exists('image_url', $data) && $data['image_url'] === null) {
            $data['image_url'] = '';
        }

        $gearItem->update($data);

        return response()->json($gearItem->fresh());
    }

    /**
     * DELETE /api/my/gear/{gearItem}
     */
    public function destroy(Request $request, GearItem $gearItem)
    {
        $this->authorizeOwn($request, $gearItem);

        $gearItem->delete();

        return response()->json(['message' => 'Gear item deleted.']);
    }

    /**
     * POST /api/my/gear/{gearItem}/image
     * Accepts a single image file and replaces the gear item image.
     */
    public function uploadImage(Request $request, GearItem $gearItem)
    {
        $this->authorizeOwn($request, $gearItem);

        $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,jfif,png,webp',
                'max:2048',
            ],
        ]);

        // Delete the old file if it was a local storage upload
        $oldUrl = $gearItem->image_url;
        if ($oldUrl && str_contains($oldUrl, '/storage/gear/')) {
            $oldPath = 'gear/' . basename($oldUrl);
            if (\Storage::disk('public')->exists($oldPath)) {
                \Storage::disk('public')->delete($oldPath);
            }
        }

        // Store the new file
        $file = $request->file('image');
        $extension = $file->getClientOriginalExtension();
        $filename = 'gear-' . $gearItem->id . '-' . time() . '.' . $extension;

        $file->storeAs('gear', $filename, 'public');

        $url = '/storage/gear/' . $filename;

        $gearItem->update(['image_url' => $url]);

        return response()->json([
            'message' => 'Image uploaded.',
            'image_url' => $url,
            'gear' => $gearItem->fresh(),
        ]);
    }


    private function authorizeOwn(Request $request, GearItem $gearItem): void
    {
        if ($gearItem->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this gear item.');
        }
    }
}
