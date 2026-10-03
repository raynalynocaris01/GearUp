<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * GET /api/owner/events
     */
    public function index(Request $request)
    {
        $events = Event::where('owner_id', $request->user()->id)
            ->orderByDesc('starts_at')
            ->get();

        return response()->json($events);
    }

    /**
     * POST /api/owner/events
     */
    public function store(Request $request)
    {
        $data = $this->validateEvent($request);

        $event = Event::create([
            ...$data,
            'owner_id' => $request->user()->id,
        ]);

        return response()->json($event, 201);
    }

    /**
     * GET /api/owner/events/{event}
     */
    public function show(Request $request, Event $event)
    {
        $this->authorizeOwner($request, $event);

        return response()->json($event);
    }

    /**
     * PUT /api/owner/events/{event}
     */
    public function update(Request $request, Event $event)
    {
        $this->authorizeOwner($request, $event);

        $data = $this->validateEvent($request, partial: true);

        $event->update($data);

        return response()->json($event->fresh());
    }

    /**
     * DELETE /api/owner/events/{event}
     */
    public function destroy(Request $request, Event $event)
    {
        $this->authorizeOwner($request, $event);

        $event->delete();

        return response()->json(['message' => 'Event deleted.']);
    }

    private function validateEvent(Request $request, bool $partial = false): array
    {
        $rules = [
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => [$partial ? 'sometimes' : 'required', 'string'],
            'location' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'region' => ['sometimes', 'nullable', 'string', 'max:100'],
            'starts_at' => [$partial ? 'sometimes' : 'required', 'date'],
            'ends_at' => [$partial ? 'sometimes' : 'required', 'date', 'after:starts_at'],
            'price_per_person' => [$partial ? 'sometimes' : 'required', 'numeric', 'min:0'],
            'capacity' => [$partial ? 'sometimes' : 'required', 'integer', 'min:1'],
            'image_url' => [$partial ? 'sometimes' : 'required', 'url'],
            'is_published' => ['sometimes', 'boolean'],
        ];

        return $request->validate($rules);
    }

    private function authorizeOwner(Request $request, Event $event): void
    {
        if ($event->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this event.');
        }
    }
}