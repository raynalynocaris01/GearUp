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
            'image_url' => ['nullable', 'url', 'max:2048'],
            'stock' => ['required', 'integer', 'min:1'],
            'is_available' => ['sometimes', 'boolean'],
        ]);

        $item = GearItem::create([
            'owner_id' => $request->user()->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? '',
            'category' => $data['category'],
            'price_per_day' => $data['price_per_day'],
            'image_url' => $data['image_url'] ?? '',
            'stock' => $data['stock'],
            'is_available' => $data['is_available'] ?? true,
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
            'image_url' => ['nullable', 'url', 'max:2048'],
            'stock' => ['sometimes', 'integer', 'min:1'],
            'is_available' => ['sometimes', 'boolean'],
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

    private function authorizeOwn(Request $request, GearItem $gearItem): void
    {
        if ($gearItem->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this gear item.');
        }
    }
}