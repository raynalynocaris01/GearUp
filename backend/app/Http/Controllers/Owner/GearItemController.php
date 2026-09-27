<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\GearItem;
use Illuminate\Http\Request;

class GearItemController extends Controller
{
    public function index(Request $request)
    {
        $items = GearItem::where('owner_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $this->validateGear($request);

        $item = GearItem::create([
            ...$data,
            'owner_id' => $request->user()->id,
        ]);

        return response()->json($item, 201);
    }

    public function show(Request $request, GearItem $gearItem)
    {
        $this->authorizeOwner($request, $gearItem);

        return response()->json($gearItem);
    }

    public function update(Request $request, GearItem $gearItem)
    {
        $this->authorizeOwner($request, $gearItem);

        $data = $this->validateGear($request, partial: true);

        $gearItem->update($data);

        return response()->json($gearItem->fresh());
    }

    public function destroy(Request $request, GearItem $gearItem)
    {
        $this->authorizeOwner($request, $gearItem);

        $gearItem->delete();

        return response()->json(['message' => 'Gear item deleted.']);
    }

    private function validateGear(Request $request, bool $partial = false): array
    {
        $rules = [
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => [$partial ? 'sometimes' : 'required', 'string'],
            'category' => [$partial ? 'sometimes' : 'required', 'string', 'max:100'],
            'price_per_day' => [$partial ? 'sometimes' : 'required', 'numeric', 'min:0'],
            'image_url' => [$partial ? 'sometimes' : 'required', 'url'],
            'stock' => [$partial ? 'sometimes' : 'required', 'integer', 'min:0'],
            'is_available' => ['sometimes', 'boolean'],
        ];

        return $request->validate($rules);
    }

    private function authorizeOwner(Request $request, GearItem $gearItem): void
    {
        if ($gearItem->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this gear item.');
        }
    }
}