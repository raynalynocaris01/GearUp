<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GuideApplication;
use App\Models\TourGuide;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
            // Optional resume — admin may skip it (auto_approved with no resume).
            'resume' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        // Store resume BEFORE the transaction (files aren't transactional).
        $resumePath = null;
        if ($request->hasFile('resume')) {
            $uuid = (string) Str::uuid();
            $resumePath = $request->file('resume')
                ->storeAs('resumes', $uuid . '.pdf', 'local');
        }

        $tempPassword = Str::random(12);
        $admin = $request->user();

        $result = DB::transaction(function () use ($data, $tempPassword, $resumePath, $admin) {
            $user = User::create([
                'name'                  => $data['name'],
                'email'                 => $data['email'],
                'password'              => $tempPassword,
                'role'                  => 'guide',
                'is_approved'           => true,
                'is_suspended'          => false,
                'password_must_change'  => true,
            ]);

            $guide = TourGuide::create([
                'user_id'         => $user->id,
                'name'            => $data['name'],
                'contact_number'  => $data['contact_number'],
                'email'           => $data['email'],
                'description'     => $data['description'] ?? null,
                'price_per_trip'  => $data['price_per_trip'],
                'location'        => $data['location'] ?? null,
                'campsite_id'     => $data['campsite_id'] ?? null,
                'is_independent'  => empty($data['campsite_id']),
                'created_by'      => $admin->id,
                'approval_status' => 'approved',
            ]);

            // Every guide — even an auto-approved one — gets an application
            // row so the full audit trail exists (who created them, when,
            // was a resume attached). Admin-created = auto_approved.
            $application = GuideApplication::create([
                'tour_guide_id'        => $guide->id,
                'applicant_user_id'    => $user->id,
                'submitted_by_user_id' => $admin->id,
                'submission_source'    => 'admin_created',
                'resume_url'           => $resumePath,
                'resume_uploaded_at'   => $resumePath ? now() : null,
                'status'               => 'auto_approved',
                'reviewed_by_user_id'  => $admin->id,
                'reviewed_at'          => now(),
            ]);

            $guide->update(['application_id' => $application->id]);

            return ['guide' => $guide, 'user' => $user, 'application' => $application];
        });

        return response()->json([
            'guide'         => $result['guide']->fresh(['campsite:id,name,location,image_url', 'creator:id,name,email']),
            'application'   => $result['application'],
            'temp_password' => $tempPassword,
            'message'       => 'Tour guide created and immediately bookable. Share the temp password with them so they can log in.',
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
     * POST /api/admin/tour-guides/{tourGuide}/update-resume
     * Admin re-uploads a resume for an already-existing guide. The guide
     * flips back to under_review and is NOT bookable until re-approved.
     * Creates a fresh GuideApplication row (never reuses the old one) so
     * the audit trail shows each resume version separately.
     */
    public function updateResume(Request $request, TourGuide $tourGuide)
    {
        $request->validate([
            'resume' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        // Delete the previous resume file (if any) to keep storage clean.
        $oldResume = $tourGuide->application?->resume_url
            ?? GuideApplication::where('tour_guide_id', $tourGuide->id)
                ->whereNotNull('resume_url')
                ->orderByDesc('created_at')
                ->value('resume_url');

        $uuid = (string) Str::uuid();
        $newResumePath = $request->file('resume')
            ->storeAs('resumes', $uuid . '.pdf', 'local');

        $admin = $request->user();

        $application = DB::transaction(function () use ($tourGuide, $newResumePath, $admin) {
            // Flip the guide back to review — it's no longer bookable
            // until an admin re-approves via GuideApplicationController.
            $tourGuide->update(['approval_status' => 'under_review']);

            $app = GuideApplication::create([
                'tour_guide_id'        => $tourGuide->id,
                'applicant_user_id'    => $tourGuide->user_id ?? $admin->id,
                'submitted_by_user_id' => $admin->id,
                'submission_source'    => 'admin_created',
                'resume_url'           => $newResumePath,
                'resume_uploaded_at'   => now(),
                'status'               => 'under_review',
            ]);

            $tourGuide->update(['application_id' => $app->id]);

            return $app;
        });

        // Clean up old file AFTER the DB work succeeds, so we don't
        // delete it if the transaction rolls back.
        if ($oldResume) {
            Storage::disk('local')->delete($oldResume);
        }

        // Notify the guide that their resume was replaced and re-review
        // is pending. Best-effort — a notification failure doesn't undo
        // the transaction.
        if ($tourGuide->user_id) {
            NotificationService::notify(
                $tourGuide->user_id,
                'guide.resume_updated',
                'Your resume was updated',
                'An admin uploaded a new version of your resume. Your guide profile is temporarily under review.',
                '/guide/profile',
            );
        }

        return response()->json([
            'message'     => 'Resume updated. Guide is now pending re-approval.',
            'guide'       => $tourGuide->fresh(['campsite:id,name,location,image_url', 'creator:id,name,email']),
            'application' => $application,
        ]);
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
