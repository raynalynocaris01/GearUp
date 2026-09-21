<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campsite;
use Illuminate\Http\Request;

class CampsiteController extends Controller
{
    /**
     * GET /api/admin/campsites
     * Optional: ?featured=1, ?owner_id=5
     */
    public function index(Request $request)
    {
        $query = Campsite::with(['owner:id,name,email']);

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->integer('owner_id'));
        }

        return response()->json(
            $query->orderByDesc('created_at')->get()
        );
    }

    /**
     * POST /api/admin/campsites/{campsite}/feature
     * Toggle featured status.
     */
    public function feature(Campsite $campsite)
    {
        $campsite->update(['is_featured' => ! $campsite->is_featured]);

        return response()->json($campsite->fresh());
    }

    /**
     * DELETE /api/admin/campsites/{campsite}
     */
    public function destroy(Campsite $campsite)
    {
        $campsite->delete();

        return response()->json(['message' => 'Campsite removed.']);
    }
}