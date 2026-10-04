<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class EventRegistrationController extends Controller
{
    /**
     * GET /api/my/events
     * List the authenticated user's event registrations.
     */
    public function mine(Request $request)
    {
        $regs = EventRegistration::with([
            'event:id,owner_id,name,description,location,region,starts_at,ends_at,price_per_person,capacity,image_url,is_published',
            'event.owner:id,name',
        ])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($regs);
    }

    /**
     * POST /api/events/{event}/register
     * Register the authenticated user for an event.
     * Body: { guests?: int }
     */
    public function store(Request $request, Event $event)
    {
        if (!$event->is_published) {
            return response()->json([
                'message' => 'This event is not open for registration.',
            ], 422);
        }

        $data = $request->validate([
            'guests' => ['sometimes', 'integer', 'min:1', 'max:20'],
        ]);
        $guests = (int) ($data['guests'] ?? 1);

        // Capacity check: count confirmed seats already taken
        $takenSeats = EventRegistration::where('event_id', $event->id)
            ->where('status', 'confirmed')
            ->sum('guests');

        if ($takenSeats + $guests > $event->capacity) {
            $remaining = max(0, $event->capacity - $takenSeats);
            return response()->json([
                'message' => "Only {$remaining} seat(s) remaining for this event.",
            ], 422);
        }

        // Prevent double-registration
        $existing = EventRegistration::where('event_id', $event->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing && $existing->status !== 'cancelled') {
            return response()->json([
                'message' => 'You are already registered for this event.',
            ], 422);
        }

        $total = $guests * (float) $event->price_per_person;

        // Reuse the row if it was previously cancelled
        if ($existing) {
            $existing->update([
                'guests' => $guests,
                'total_price' => $total,
                'status' => 'confirmed',
            ]);
            $reg = $existing->fresh(['event', 'event.owner']);
        } else {
            $reg = EventRegistration::create([
                'user_id' => $request->user()->id,
                'event_id' => $event->id,
                'guests' => $guests,
                'total_price' => $total,
                'status' => 'confirmed',
            ]);
            $reg->load(['event', 'event.owner']);
        }

        // Notify the event owner (skip if they registered for their own event)
        if ($event->owner_id) {
            NotificationService::notifyOthers(
                $request->user()->id,
                $event->owner_id,
                'event.registration',
                'New event registration',
                "{$request->user()->name} registered for {$event->name}",
                "/owner/events/{$event->id}/attendees",
            );
        }

        return response()->json($reg, 201);
    }

    /**
     * POST /api/registrations/{registration}/cancel
     * Cancel own registration.
     */
    public function cancel(Request $request, EventRegistration $registration)
    {
        if ($registration->user_id !== $request->user()->id) {
            abort(403, 'You do not own this registration.');
        }

        if ($registration->status === 'cancelled') {
            return response()->json(['message' => 'Already cancelled.']);
        }

        $registration->update(['status' => 'cancelled']);

        $registration->loadMissing('event');
        $ownerId = $registration->event?->owner_id;
        if ($ownerId) {
            NotificationService::notifyOthers(
                $request->user()->id,
                $ownerId,
                'event.registration.cancelled',
                'Event registration cancelled',
                "{$request->user()->name} cancelled their spot at {$registration->event->name}",
                "/owner/events/{$registration->event_id}/attendees",
            );
        }

        return response()->json([
            'message' => 'Registration cancelled.',
            'registration' => $registration->fresh(),
        ]);
    }

    /**
     * GET /api/events/{event}/registration-status
     * Returns the caller's registration for this event (or null).
     */
    public function status(Request $request, Event $event)
    {
        $reg = EventRegistration::where('event_id', $event->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$reg) {
            return response()->json(null);
        }

        return response()->json($reg->only([
            'id',
            'user_id',
            'event_id',
            'guests',
            'total_price',
            'status',
            'created_at',
            'updated_at',
        ]));
    }
}