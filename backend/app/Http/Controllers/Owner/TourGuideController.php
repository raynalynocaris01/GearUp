<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Campsite;
use App\Models\TourGuide;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TourGuideController extends Controller
{
    /**
     * GET /api/owner/campsites/{campsite}/tour-guides
     */
    public function index(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        return response()->json($campsite->tourGuides()->get());
    }

    /**
     * GET /api/owner/tour-guides
     * List all guides (attached + independent) owned by the user.
     * "Owned" means: guides attached to the user's campsites
     * OR independent guides the user created.
     */
        public function all(Request $request)
    {
        $userId = $request->user()->id;

        $campsiteIds = Campsite::where('owner_id', $userId)->pluck('id');

        $guides = TourGuide::with('campsite:id,name')
            ->where(function ($q) use ($campsiteIds, $userId) {
                $q->whereIn('campsite_id', $campsiteIds)
                  ->orWhere('created_by', $userId);
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json($guides);
    }

    /**
     * POST /api/owner/campsites/{campsite}/tour-guides
     */
    public function store(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        $data = $request->validate($this->guideRules());
        $data['created_by'] = $request->user()->id;
        $data['price_per_trip'] = $data['price_per_trip'] ?? 0;

        $tempPassword = Str::random(12);

        $guide = DB::transaction(function () use ($data, $tempPassword, $campsite) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $tempPassword,
                'role' => 'guide',
                'is_approved' => true,
                'is_suspended' => false,
                'password_must_change' => true,
                'terms_accepted_at' => now(),
            ]);

            return $campsite->tourGuides()->create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'contact_number' => $data['contact_number'],
                'description' => $data['description'] ?? null,
                'price_per_trip' => $data['price_per_trip'],
                'location' => $data['location'] ?? null,
                'is_independent' => false,
                'created_by' => $data['created_by'],
            ]);
        });

        return response()->json([
            'guide' => $guide->load(['campsite:id,name,location,image_url', 'creator:id,name,email']),
            'temp_password' => $tempPassword,
            'message' => 'Tour guide created. Share the temp password with them so they can log in.',
        ], 201);
    }

    /**
     * POST /api/owner/tour-guides
     * Create an independent guide (not attached to a campsite).
     */
    public function storeIndependent(Request $request)
    {
        $data = $request->validate($this->guideRules());
        $data['price_per_trip'] = $data['price_per_trip'] ?? 0;
        $data['created_by'] = $request->user()->id;

        $tempPassword = Str::random(12);

        $guide = DB::transaction(function () use ($data, $tempPassword) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $tempPassword,
                'role' => 'guide',
                'is_approved' => true,
                'is_suspended' => false,
                'password_must_change' => true,
                'terms_accepted_at' => now(),
            ]);

            return TourGuide::create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'contact_number' => $data['contact_number'],
                'description' => $data['description'] ?? null,
                'price_per_trip' => $data['price_per_trip'],
                'location' => $data['location'] ?? null,
                'is_independent' => true,
                'campsite_id' => null,
                'created_by' => $data['created_by'],
            ]);
        });

        return response()->json([
            'guide' => $guide->load('creator:id,name,email'),
            'temp_password' => $tempPassword,
        ], 201);
    }

    /**
     * PUT /api/owner/tour-guides/{tourGuide}
     * Update a guide the authenticated user owns.
     */
    public function update(Request $request, TourGuide $tourGuide)
    {
        $this->authorizeGuide($request, $tourGuide);

        $data = $request->validate($this->guideUpdateRules($tourGuide));

        DB::transaction(function () use ($data, $tourGuide) {
            if (isset($data['email']) && $tourGuide->user_id) {
                $userUpdate = [
                    'email' => $data['email'],
                ];
                if (isset($data['name'])) {
                    $userUpdate['name'] = $data['name'];
                }
                User::where('id', $tourGuide->user_id)->update($userUpdate);
            }

            $tourGuide->update($data);
        });

        return response()->json($tourGuide->fresh('campsite'));
    }

    /**
     * DELETE /api/owner/tour-guides/{tourGuide}
     */
    public function destroy(Request $request, TourGuide $tourGuide)
    {
        $this->authorizeGuide($request, $tourGuide);

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

    private function guideUpdateRules(TourGuide $tourGuide): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'contact_number' => ['sometimes', 'string', 'max:50'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($tourGuide->user_id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_per_trip' => ['sometimes', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function guideRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_per_trip' => ['nullable', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function authorizeOwner(Request $request, Campsite $campsite): void
    {
        if ($campsite->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this campsite.');
        }
    }

    /**
     * A guide is "owned" if:
     * - The user created it (created_by matches), OR
     * - It's attached to a campsite the user owns.
     */
    private function authorizeGuide(Request $request, TourGuide $tourGuide): void
    {
        $userId = $request->user()->id;

        if ($tourGuide->created_by === $userId) {
            return;
        }

        if ($tourGuide->campsite && $tourGuide->campsite->owner_id === $userId) {
            return;
        }

        abort(403, 'You do not own this tour guide.');
    }
}
