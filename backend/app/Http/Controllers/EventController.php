<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * GET /api/events
     * Public list of published events.
     */
    public function index(Request $request)
    {
        $query = Event::with('owner:id,name,email')
            ->where('is_published', true);

        // Optional filter by region
        if ($request->filled('region')) {
            $query->where('region', $request->query('region'));
        }

        // Optional filter: only upcoming events (ends_at >= now)
        if ($request->boolean('upcoming')) {
            $query->where('ends_at', '>=', now());
        }

        // Order by soonest first
        $query->orderBy('starts_at');

        return response()->json($query->get());
    }

    /**
     * GET /api/events/{event}
     * Public detail for a single event.
     */
    public function show(Event $event)
    {
        if (! $event->is_published) {
            abort(404);
        }

        $event->load('owner:id,name,email');

        return response()->json($event);
    }
}