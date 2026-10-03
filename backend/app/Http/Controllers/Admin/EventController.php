<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * GET /api/admin/events
     * All events platform-wide, newest first.
     * Optional: ?published=true|false, ?limit=N (default 100, max 500)
     */
    public function index(Request $request)
    {
        $query = Event::with('owner:id,name,email');

        if ($request->query('published') === 'true') {
            $query->where('is_published', true);
        } elseif ($request->query('published') === 'false') {
            $query->where('is_published', false);
        }

        $limit = (int) $request->query('limit', 100);
        if ($limit < 1) $limit = 100;
        if ($limit > 500) $limit = 500;

        $events = $query->orderByDesc('starts_at')->limit($limit)->get();

        return response()->json($events);
    }
}