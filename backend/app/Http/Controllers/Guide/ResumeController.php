<?php

namespace App\Http\Controllers\Guide;

use App\Http\Controllers\Controller;
use App\Models\GuideApplication;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ResumeController extends Controller
{
    /**
     * GET /api/guide/resume
     * Returns the current application status and resume metadata for
     * the authenticated guide. Returns 200 with resume_url=null when
     * no resume has been uploaded yet (per UX decision).
     */
    public function show(Request $request)
    {
        $user = $request->user();

        // Find the most recent application for this user (applicant side).
        $application = GuideApplication::where('applicant_user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();

        if (! $application) {
            return response()->json([
                'has_application' => false,
                'application_id'  => null,
                'status'          => null,
                'resume_url'      => null,
                'resume_uploaded_at' => null,
                'rejection_reason'   => null,
                'reviewed_at'        => null,
            ]);
        }

        return response()->json([
            'has_application'    => true,
            'application_id'     => $application->id,
            'status'             => $application->status,
            'resume_url'         => $application->resume_url,
            'resume_uploaded_at' => $application->resume_uploaded_at,
            'rejection_reason'   => $application->rejection_reason,
            'reviewed_at'        => $application->reviewed_at,
        ]);
    }

    /**
     * POST /api/guide/resume
     * Upload (or re-upload) a PDF resume. Creates a new application if
     * none exists, or updates the current one and flips status to
     * under_review (re-review required after re-upload).
     */
    public function store(Request $request)
    {
        $request->validate([
            'resume' => [
                'required',
                'file',
                'mimes:pdf',
                'max:5120', // 5 MB
            ],
        ]);

        $user = $request->user();

        // Find most recent application for this user. If none, we'll
        // create one (covers the customer_upgrade case where the user
        // has not yet been added to a GuideApplication row).
        $application = GuideApplication::where('applicant_user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();

        $file = $request->file('resume');

        $path = DB::transaction(function () use ($user, $file, &$application) {
            // Store the file at storage/app/private/resumes/{uuid}.pdf
            $uuid = (string) Str::uuid();
            $filename = $uuid . '.pdf';
            $storedPath = $file->storeAs('resumes', $filename, 'local');

            if (! $application) {
                // No application yet — create one.
                // This happens when a customer clicks "become a guide"
                // and the AuthController::becomeGuide path hasn't created
                // the application row (we'll add that in Commit 6), OR
                // if the row was manually deleted. Either way, be safe:
                // create a fresh self_signup application.
                $application = GuideApplication::create([
                    'applicant_user_id'   => $user->id,
                    'submitted_by_user_id' => $user->id,
                    'submission_source'    => 'self_signup',
                    'resume_url'           => $storedPath,
                    'resume_uploaded_at'   => now(),
                    'status'               => 'under_review',
                ]);
            } else {
                // Application exists — update resume and flip status.
                // Any previous status (pending, under_review, approved,
                // rejected) becomes under_review. Re-approval required.
                $application->update([
                    'resume_url'         => $storedPath,
                    'resume_uploaded_at' => now(),
                    'status'             => 'under_review',
                    'rejection_reason'   => null,
                    'reviewed_by_user_id' => null,
                    'reviewed_at'         => null,
                ]);
            }

            // Ensure user is at least marked as guide role so admin
            // review queue can find them. is_approved stays false
            // until an admin approves via GuideApplicationController.
            $user->update(['role' => 'guide', 'is_approved' => false]);

            return $storedPath;
        });

        // Notify all admins.
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            NotificationService::notify(
                $admin->id,
                'guide.application_submitted',
                'New guide application to review',
                "{$user->name} ({$user->email}) uploaded a resume for review.",
                '/admin/guide-applications?status=under_review',
            );
        }

        return response()->json([
            'message'     => 'Resume uploaded. Your application is under review.',
            'application' => $application->fresh(),
        ]);
    }
}