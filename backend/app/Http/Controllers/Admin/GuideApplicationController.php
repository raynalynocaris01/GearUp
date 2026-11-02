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

class GuideApplicationController extends Controller
{
    /**
     * GET /api/admin/guide-applications
     * Optional: ?status=pending|under_review|approved|rejected|auto_approved
     */
    public function index(Request $request)
    {
        $query = GuideApplication::with([
            'applicant:id,name,email,role,is_approved',
            'submitter:id,name,email,role',
            'reviewer:id,name,email',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json(
            $query->orderByDesc('created_at')->get(),
        );
    }

    /**
     * GET /api/admin/guide-applications/{guideApplication}
     */
    public function show(GuideApplication $guideApplication)
    {
        return response()->json(
            $guideApplication->load([
                'applicant:id,name,email,role,is_approved',
                'submitter:id,name,email,role',
                'reviewer:id,name,email',
                'tourGuide:id,name,email,approval_status',
            ]),
        );
    }

    /**
     * GET /api/admin/guide-applications/{guideApplication}/resume
     * Streams the PDF from the private local disk (auth-gated).
     */
    public function downloadResume(GuideApplication $guideApplication)
    {
        if (! $guideApplication->resume_url) {
            return response()->json([
                'message' => 'No resume attached to this application.',
            ], 404);
        }

        $disk = Storage::disk('local');
        if (! $disk->exists($guideApplication->resume_url)) {
            return response()->json([
                'message' => 'Resume file not found on disk.',
            ], 404);
        }

        return $disk->response(
            $guideApplication->resume_url,
            'resume-' . $guideApplication->id . '.pdf',
            ['Content-Type' => 'application/pdf'],
        );
    }

    /**
     * POST /api/admin/guide-applications/{guideApplication}/approve
     * Approves the application and creates the tour_guides row if it
     * does not already exist.
     */
    public function approve(Request $request, GuideApplication $guideApplication)
    {
        if ($guideApplication->isApproved()) {
            return response()->json([
                'message' => 'This application is already approved.',
            ], 422);
        }

        $admin = $request->user();

        $tourGuide = DB::transaction(function () use ($guideApplication, $admin) {
            $applicant = $guideApplication->applicant;

            // Find or create the tour_guides row.
            $guide = TourGuide::where('user_id', $applicant->id)->first();

            if ($guide) {
                $guide->update([
                    'approval_status' => 'approved',
                    'application_id'  => $guideApplication->id,
                ]);
            } else {
                $guide = TourGuide::create([
                    'user_id'         => $applicant->id,
                    'application_id'  => $guideApplication->id,
                    'name'            => $applicant->name,
                    'email'           => $applicant->email,
                    'contact_number'  => '',
                    'description'     => null,
                    'price_per_trip'  => 0,
                    'is_independent'  => true,
                    'campsite_id'     => null,
                    'location'        => null,
                    'created_by'      => $admin->id,
                    'approval_status' => 'approved',
                ]);
            }

            // Mark the application approved and link the guide.
            $guideApplication->update([
                'status'              => 'approved',
                'tour_guide_id'       => $guide->id,
                'reviewed_by_user_id' => $admin->id,
                'reviewed_at'         => now(),
            ]);

            // Flip the user to approved guide.
            $applicant->update([
                'role'        => 'guide',
                'is_approved' => true,
            ]);

            return $guide;
        });

        NotificationService::notify(
            $guideApplication->applicant_user_id,
            'guide.application_approved',
            'Your guide application was approved',
            'You can now accept tour guide bookings on GearUp. Complete your profile to start receiving bookings.',
            '/guide/profile',
        );

        return response()->json([
            'message'     => 'Guide application approved.',
            'application' => $guideApplication->fresh([
                'applicant:id,name,email',
                'reviewer:id,name,email',
            ]),
            'guide'       => $tourGuide->fresh([
                'campsite:id,name,location,image_url',
                'creator:id,name,email',
            ]),
        ]);
    }

    /**
     * POST /api/admin/guide-applications/{guideApplication}/reject
     * Body: { rejection_reason: string (required) }
     */
    public function reject(Request $request, GuideApplication $guideApplication)
    {
        if ($guideApplication->isApproved()) {
            return response()->json([
                'message' => 'This application has already been approved and cannot be rejected.',
            ], 422);
        }

        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:2000'],
        ]);

        $admin = $request->user();

        DB::transaction(function () use ($guideApplication, $data, $admin) {
            $guideApplication->update([
                'status'              => 'rejected',
                'rejection_reason'    => $data['rejection_reason'],
                'reviewed_by_user_id' => $admin->id,
                'reviewed_at'         => now(),
            ]);

            // Revert the user back to a customer, keep is_approved=true
            // so they can keep using the app as a regular customer.
            User::where('id', $guideApplication->applicant_user_id)
                ->update(['role' => 'customer', 'is_approved' => true]);
        });

        NotificationService::notify(
            $guideApplication->applicant_user_id,
            'guide.application_rejected',
            'Your guide application was declined',
            'Reason: ' . $data['rejection_reason'],
            '/become-a-guide',
        );

        return response()->json([
            'message'     => 'Guide application rejected.',
            'application' => $guideApplication->fresh([
                'applicant:id,name,email',
                'reviewer:id,name,email',
            ]),
        ]);
    }
}