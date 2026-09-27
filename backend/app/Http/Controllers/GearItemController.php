<?php

namespace App\Http\Controllers;

use App\Models\GearItem;
use Illuminate\Http\Request;

class GearItemController extends Controller
{
    /**
     * GET /api/gear
     * Optional: ?category=Tent, ?owner_id=6, ?available=1
     */
    public function index(Request $request)
    {
        $query = GearItem::with('owner:id,name,email');

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->integer('owner_id'));
        }

        if ($request->boolean('available')) {
            $query->where('is_available', true)->where('stock', '>', 0);
        }

        return response()->json(
            $query->orderByDesc('created_at')->get()
        );
    }

    /**
     * GET /api/gear/{gearItem}
     */
    public function show(GearItem $gearItem)
    {
        return response()->json(
            $gearItem->load('owner:id,name,email')
        );
    }
}