<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserPickupController extends Controller
{
    /**
     * GET /api/user/pickup
     * Returns the authenticated user's pickup info.
     */
    public function show(Request $request)
    {
        return response()->json([
            'pickup_info' => $request->user()->pickupInfoArray(),
        ]);
    }

    /**
     * PUT /api/user/pickup
     * Update the authenticated user's pickup info.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'pickup_method' => ['sometimes', 'nullable', 'in:meetup,pickup,deliver,all'],
            'pickup_address' => ['nullable', 'string', 'max:1000'],
            'pickup_landmark' => ['nullable', 'string', 'max:255'],
            'pickup_hours' => ['nullable', 'string', 'max:255'],
            'pickup_instructions' => ['nullable', 'string', 'max:1000'],
            'pickup_contact_number' => ['nullable', 'string', 'max:30'],
            'facebook_url' => ['nullable', 'url', 'max:255'],
        ]);

        $method = $data['pickup_method'] ?? null;

        // If the user set 'pickup' or 'all', they must provide an address.
        if (in_array($method, ['pickup', 'all'], true) && empty($data['pickup_address'])) {
            throw ValidationException::withMessages([
                'pickup_address' => 'Please enter the pickup address so renters can find you.',
            ]);
        }

        $request->user()->update($data);

        return response()->json([
            'message' => 'Pickup info saved.',
            'pickup_info' => $request->user()->fresh()->pickupInfoArray(),
        ]);
    }
}