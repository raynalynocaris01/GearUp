<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TourGuideController extends Controller
{
    /**
     * GET /api/admin/tour-guides
     * List all tour guides platform-wide.
     * Optional: ?independent=true|false
     */
    public function index(Request $request)
    {
        $query = TourGuide::with([
            'campsite:id,name,location,image_url',
            'creator:id,name,email',
        ]);

        if ($request->filled('independent')) {
            $query->where(
                'is_independent',
                $request->boolean('independent'),
            );
        }

        $guides = $query->orderByDesc('created_at')->get();

        return response()->json($guides);
    }

    /**
     * POST /api/admin/tour-guides
     * Create a tour guide. Admin can create either an independent guide
     * or attach one to a specific campsite.
     */
    /**
     * POST /api/admin/tour-guides
     * Create a tour guide AND an auto-generated User account.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_per_trip' => ['required', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'campsite_id' => ['nullable', 'integer', 'exists:campsites,id'],
        ]);

        $tempPassword = Str::random(12);

        $guide = DB::transaction(function () use ($data, $tempPassword, $request) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $tempPassword,
                'role' => 'guide',
                'is_approved' => true,
                'is_suspended' => false,
                'password_must_change' => true,
            ]);

            return TourGuide::create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'contact_number' => $data['contact_number'],
                'email' => $data['email'],
                'description' => $data['description'] ?? null,
                'price_per_trip' => $data['price_per_trip'],
                'location' => $data['location'] ?? null,
                'campsite_id' => $data['campsite_id'] ?? null,
                'is_independent' => empty($data['campsite_id']),
                'created_by' => $request->user()->id,
            ]);
        });

        return response()->json([
            'guide' => $guide->load(['campsite:id,name,location,image_url', 'creator:id,name,email']),
            'temp_password' => $tempPassword,
            'message' => 'Tour guide created. Share the temp password with them so they can log in.',
        ], 201);
    }

    /**
     * PUT /api/admin/tour-guides/{tourGuide}
     */
    public function update(Request $request, TourGuide $tourGuide)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'contact_number' => ['sometimes', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_per_trip' => ['sometimes', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'campsite_id' => ['nullable', 'integer', 'exists:campsites,id'],
        ]);

        // If campsite_id is being changed, keep is_independent in sync
        if (array_key_exists('campsite_id', $data)) {
            $data['is_independent'] = empty($data['campsite_id']);
        }

        $tourGuide->update($data);

        return response()->json(
            $tourGuide->fresh(['campsite:id,name,location,image_url', 'creator:id,name,email']),
        );
    }

    /**
     * DELETE /api/admin/tour-guides/{tourGuide}
     */
    public function destroy(TourGuide $tourGuide)
    {
        // Block deletion if active bookings exist
        $hasActiveBookings = $tourGuide->bookings()
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($hasActiveBookings) {
            return response()->json([
                'message' => 'Cannot delete a guide with active bookings. Cancel or complete them first.',
            ], 409);
        }

        DB::transaction(function () use ($tourGuide) {
            $userId = $tourGuide->user_id;
            $tourGuide->delete();
            if ($userId) {
                User::where('id', $userId)
                    ->where('role', 'guide')
                    ->update(['is_suspended' => true]);
            }
        });

        return response()->json(['message' => 'Tour guide removed.']);
    }
}
