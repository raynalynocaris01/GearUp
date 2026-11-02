<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Campsite;
use App\Models\GuideApplication;
use App\Models\TourGuide;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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

        $query = TourGuide::with('campsite:id,name')
            ->where(function ($q) use ($campsiteIds, $userId) {
                $q->whereIn('campsite_id', $campsiteIds)
                  ->orWhere('created_by', $userId);
            });

        // The "Attach Guide" dropdown on the owner UI passes
        // ?approved_only=1 so it only lists guides that are bookable.
        // The general list (default) shows all guides the owner owns,
        // including ones awaiting admin approval.
        if ($request->boolean('approved_only')) {
            $query->approved();
        }

        return response()->json(
            $query->orderByDesc('created_at')->get(),
        );
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

        // Store the resume BEFORE the transaction. If the transaction
        // rolls back, we have an orphan file — but the file has a random
        // UUID name so it doesn't leak into anything and gets cleaned up
        // by a future housekeeping job. This is the standard pattern for
        // file uploads + DB transactions (files aren't transactional).
        $resumePath = $this->storeResume($request);

        // Handle email collisions: customer → upgrade, owner/admin → reject,
        // existing guide → reuse their tour_guides row.
        $existingUser = User::where('email', $data['email'])->first();

        if ($existingUser && in_array($existingUser->role, ['owner', 'admin'], true)) {
            // Clean up the just-stored resume — we're not going to use it.
            Storage::disk('local')->delete($resumePath);

            return response()->json([
                'message' => 'This email belongs to an existing ' . $existingUser->role . ' account and cannot be used for a tour guide.',
            ], 422);
        }

        if ($existingUser && $existingUser->role === 'guide') {
            $existingGuide = TourGuide::where('user_id', $existingUser->id)->first();

            if ($existingGuide) {
                // Re-use their guide profile, attach to campsite,
                // and put them back through the review process
                // (since this owner is vouching for them fresh).
                $application = DB::transaction(function () use (
                    $existingGuide, $existingUser, $data, $campsite, $resumePath, $request
                ) {
                    $existingGuide->update([
                        'campsite_id'     => $campsite->id,
                        'is_independent'  => false,
                        'created_by'      => $data['created_by'],
                        'name'            => $data['name'],
                        'contact_number'  => $data['contact_number'],
                        'description'     => $data['description'] ?? $existingGuide->description,
                        'price_per_trip'  => $data['price_per_trip'],
                        'approval_status' => 'pending',
                    ]);

                    $app = GuideApplication::create([
                        'tour_guide_id'        => $existingGuide->id,
                        'applicant_user_id'    => $existingUser->id,
                        'submitted_by_user_id' => $request->user()->id,
                        'submission_source'    => 'owner_created',
                        'resume_url'           => $resumePath,
                        'resume_uploaded_at'   => now(),
                        'status'               => 'under_review',
                    ]);

                    $existingGuide->update(['application_id' => $app->id]);

                    $existingUser->update([
                        'role'        => 'guide',
                        'is_approved' => false,
                    ]);

                    return $app;
                });

                return response()->json([
                    'guide'         => $existingGuide->fresh(['campsite:id,name,location,image_url', 'creator:id,name,email']),
                    'application'   => $application,
                    'temp_password' => null,
                    'message'       => 'Existing guide re-submitted for admin approval.',
                ], 200);
            }
        }

        // No existing guide — create a new guide user + tour_guides row
        // + GuideApplication. Guide stays unapproved until admin review.
        $tempPassword = Str::random(12);

        $result = DB::transaction(function () use (
            $data, $tempPassword, $campsite, $resumePath, $request, $existingUser
        ) {
            if ($existingUser && $existingUser->role === 'customer') {
                // Upgrade the existing customer. Do NOT reset their password
                // or force a password change — they already have credentials.
                $existingUser->update([
                    'role'        => 'guide',
                    'is_approved' => false,
                ]);
                $user = $existingUser;
            } else {
                // No existing user — create one with a temp password.
                $user = User::create([
                    'name'                  => $data['name'],
                    'email'                 => $data['email'],
                    'password'              => $tempPassword,
                    'role'                  => 'guide',
                    'is_approved'           => false,
                    'is_suspended'          => false,
                    'password_must_change'  => true,
                    'terms_accepted_at'     => now(),
                ]);
            }

            $guide = $campsite->tourGuides()->create([
                'user_id'         => $user->id,
                'name'            => $data['name'],
                'email'           => $data['email'],
                'contact_number'  => $data['contact_number'],
                'description'     => $data['description'] ?? null,
                'price_per_trip'  => $data['price_per_trip'],
                'location'        => $data['location'] ?? null,
                'is_independent'  => false,
                'created_by'      => $data['created_by'],
                'approval_status' => 'pending',
            ]);

            $application = GuideApplication::create([
                'tour_guide_id'        => $guide->id,
                'applicant_user_id'    => $user->id,
                'submitted_by_user_id' => $request->user()->id,
                'submission_source'    => 'owner_created',
                'resume_url'           => $resumePath,
                'resume_uploaded_at'   => now(),
                'status'               => 'under_review',
            ]);

            $guide->update(['application_id' => $application->id]);

            return ['guide' => $guide, 'user' => $user, 'application' => $application];
        });

        return response()->json([
            'guide'         => $result['guide']->fresh(['campsite:id,name,location,image_url', 'creator:id,name,email']),
            'application'   => $result['application'],
            'temp_password' => $existingUser ? null : $tempPassword,
            'message'       => $existingUser
                ? 'Existing customer upgraded to guide. Awaiting admin approval.'
                : 'Tour guide created. Awaiting admin approval. Share the temp password with them so they can log in.',
        ], 201);
    }

    /**
     * POST /api/owner/tour-guides
     * Create an independent guide (not attached to a campsite).
     */
    /**
     * POST /api/owner/campsites/{campsite}/attach-guide
     * Attach an existing guide profile to this campsite by ID.
     */
    public function attach(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        $request->validate([
            'guide_id' => ['required', 'integer', 'exists:tour_guides,id'],
        ]);

        $guide = TourGuide::findOrFail($request->input('guide_id'));

        // Ensure the owner actually owns this guide profile
        if ($guide->created_by !== $request->user()->id && (! $guide->campsite || $guide->campsite->owner_id !== $request->user()->id)) {
            abort(403, 'You do not own this tour guide profile.');
        }

        // Only approved (or legacy) guides can be attached to a campsite.
        // Otherwise the owner could bypass admin review just by attaching
        // a pending guide to a bookable campsite.
        if (! in_array($guide->approval_status, ['approved', 'legacy'], true)) {
            return response()->json([
                'message' => 'This guide is still pending admin approval and cannot be attached yet.',
            ], 422);
        }

        $guide->update([
            'campsite_id' => $campsite->id,
            'is_independent' => false,
        ]);

        return response()->json([
            'message' => 'Guide attached to campsite.',
            'guide' => $guide->load('campsite'),
        ]);
    }


    public function storeIndependent(Request $request)
    {
        $data = $request->validate($this->guideRules());
        $data['price_per_trip'] = $data['price_per_trip'] ?? 0;
        $data['created_by'] = $request->user()->id;

        $resumePath = $this->storeResume($request);

        // Same email-collision logic as store().
        $existingUser = User::where('email', $data['email'])->first();

        if ($existingUser && in_array($existingUser->role, ['owner', 'admin'], true)) {
            Storage::disk('local')->delete($resumePath);

            return response()->json([
                'message' => 'This email belongs to an existing ' . $existingUser->role . ' account and cannot be used for a tour guide.',
            ], 422);
        }

        $tempPassword = Str::random(12);

        $result = DB::transaction(function () use (
            $data, $tempPassword, $resumePath, $request, $existingUser
        ) {
            if ($existingUser && $existingUser->role === 'guide') {
                $guide = TourGuide::where('user_id', $existingUser->id)->first();

                if ($guide) {
                    // Reuse the existing profile, re-queue for review.
                    $guide->update([
                        'name'            => $data['name'],
                        'contact_number'  => $data['contact_number'],
                        'description'     => $data['description'] ?? $guide->description,
                        'price_per_trip'  => $data['price_per_trip'],
                        'location'        => $data['location'] ?? $guide->location,
                        'created_by'      => $data['created_by'],
                        'is_independent'  => true,
                        'campsite_id'     => null,
                        'approval_status' => 'pending',
                    ]);

                    $application = GuideApplication::create([
                        'tour_guide_id'        => $guide->id,
                        'applicant_user_id'    => $existingUser->id,
                        'submitted_by_user_id' => $request->user()->id,
                        'submission_source'    => 'owner_created',
                        'resume_url'           => $resumePath,
                        'resume_uploaded_at'   => now(),
                        'status'               => 'under_review',
                    ]);

                    $guide->update(['application_id' => $application->id]);

                    $existingUser->update([
                        'role'        => 'guide',
                        'is_approved' => false,
                    ]);

                    return ['guide' => $guide, 'user' => $existingUser, 'application' => $application, 'reused' => true];
                }
            }

            // Create or upgrade the guide user.
            if ($existingUser && $existingUser->role === 'customer') {
                $existingUser->update([
                    'role'        => 'guide',
                    'is_approved' => false,
                ]);
                $user = $existingUser;
            } else {
                $user = User::create([
                    'name'                  => $data['name'],
                    'email'                 => $data['email'],
                    'password'              => $tempPassword,
                    'role'                  => 'guide',
                    'is_approved'           => false,
                    'is_suspended'          => false,
                    'password_must_change'  => true,
                    'terms_accepted_at'     => now(),
                ]);
            }

            $guide = TourGuide::create([
                'user_id'         => $user->id,
                'name'            => $data['name'],
                'email'           => $data['email'],
                'contact_number'  => $data['contact_number'],
                'description'     => $data['description'] ?? null,
                'price_per_trip'  => $data['price_per_trip'],
                'location'        => $data['location'] ?? null,
                'is_independent'  => true,
                'campsite_id'     => null,
                'created_by'      => $data['created_by'],
                'approval_status' => 'pending',
            ]);

            $application = GuideApplication::create([
                'tour_guide_id'        => $guide->id,
                'applicant_user_id'    => $user->id,
                'submitted_by_user_id' => $request->user()->id,
                'submission_source'    => 'owner_created',
                'resume_url'           => $resumePath,
                'resume_uploaded_at'   => now(),
                'status'               => 'under_review',
            ]);

            $guide->update(['application_id' => $application->id]);

            return ['guide' => $guide, 'user' => $user, 'application' => $application, 'reused' => false];
        });

        return response()->json([
            'guide'         => $result['guide']->fresh('creator:id,name,email'),
            'application'   => $result['application'],
            'temp_password' => ($existingUser ? null : $tempPassword),
            'message'       => $result['reused']
                ? 'Existing guide re-submitted for admin approval.'
                : 'Tour guide created. Awaiting admin approval.',
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

        // If the guide is attached to a campsite, DETACH it instead of deleting.
        // This keeps the guide in the owner's "My Tour Guides" pool so they
        // can be re-attached to a campsite later. If the guide is already
        // independent (campsite_id is null), we do a hard delete.
        if ($tourGuide->campsite_id !== null) {
            $tourGuide->update([
                'campsite_id' => null,
                'is_independent' => true,
            ]);

            return response()->json([
                'message' => 'Tour guide detached from campsite. You can re-attach them anytime from My Tour Guides.',
            ]);
        }

        // Independent guide — hard delete (user stays, guide profile is removed)
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
            'email' => ['required', 'email', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_per_trip' => ['nullable', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'resume' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ];
    }

    /**
     * Store the uploaded resume on the private local disk and return
     * the relative path. Callers are responsible for cleaning up the
     * file if the transaction rolls back.
     */
    private function storeResume(Request $request): string
    {
        $uuid = (string) Str::uuid();
        $filename = $uuid . '.pdf';

        return $request->file('resume')
            ->storeAs('resumes', $filename, 'local');
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
