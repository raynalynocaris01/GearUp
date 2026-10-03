<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\Request;

class EventRegistrationController extends Controller
{
    /**
     * GET /api/owner/events/{event}/registrations
     * Owner sees all registrations for their event.
     */
    public function index(Request $request, Event $event)
    {
        if ($event->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this event.');
        }

        $regs = EventRegistration::with('user:id,name,email')
            ->where('event_id', $event->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($regs);
    }
}