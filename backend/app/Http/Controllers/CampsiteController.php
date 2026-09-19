<?php

namespace App\Http\Controllers;

use App\Models\Campsite;
use Illuminate\Http\Request;

class CampsiteController extends Controller
{
    /**
     * GET /api/campsites
     * Optional query: ?featured=1 to filter featured only.
     */
    public function index(Request $request)
    {
        $query = Campsite::query();

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        return response()->json(
            $query->orderByDesc('rating')->get()
        );
    }

    /**
     * GET /api/campsites/{campsite}
     */
    public function show(Campsite $campsite)
    {
        return response()->json($campsite);
    }
}