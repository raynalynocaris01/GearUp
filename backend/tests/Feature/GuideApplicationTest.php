<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\GuideApplication;
use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GuideApplicationTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────

    /**
     * Create a user with role=guide, in the given approval state.
     */
    private function makeGuide(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role'        => 'guide',
            'is_approved' => false,
        ], $overrides));
    }

    /**
     * Create a plain TourGuide row for the given user.
     */
    private function makeTourGuide(User $user, array $overrides = []): TourGuide
    {
        return TourGuide::create(array_merge([
            'user_id'         => $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'contact_number'  => '09171234567',
            'description'     => 'Test guide',
            'price_per_trip'  => 1000,
            'is_independent'  => true,
            'campsite_id'     => null,
            'location'        => null,
            'created_by'      => $user->id,
            'approval_status' => 'pending',
        ], $overrides));
    }

    // ──────────────────────────────────────────────────────────
    // 1. Customer become-guide → GuideApplication pending
    // ──────────────────────────────────────────────────────────

    public function test_customer_become_guide_creates_pending_application(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/user/become-guide');

        $response->assertOk();
        $response->assertJsonPath('guide_application_id', fn ($id) => $id !== null);

        $this->assertDatabaseHas('guide_applications', [
            'applicant_user_id' => $customer->id,
            'submission_source' => 'customer_upgrade',
            'status'            => 'pending',
        ]);

        $this->assertDatabaseHas('users', [
            'id'          => $customer->id,
            'role'        => 'guide',
            'is_approved' => false,
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // 2. Guide uploads resume → status under_review + admins notified
    // ──────────────────────────────────────────────────────────

    public function test_guide_can_upload_resume_and_flips_to_under_review(): void
    {
        Storage::fake('local');

        $admin = User::factory()->admin()->create();
        $guide = $this->makeGuide();

        // Bootstrap: an application row exists in pending state.
        GuideApplication::create([
            'applicant_user_id'    => $guide->id,
            'submitted_by_user_id' => $guide->id,
            'submission_source'    => 'self_signup',
            'status'               => 'pending',
        ]);

        $response = $this->actingAs($guide)->postJson('/api/guide/resume', [
            'resume' => UploadedFile::fake()->create('resume.pdf', 500, 'application/pdf'),
        ]);

        $response->assertOk();
        $response->assertJsonPath('application.status', 'under_review');

        $this->assertDatabaseHas('guide_applications', [
            'applicant_user_id' => $guide->id,
            'status'            => 'under_review',
        ]);

        // Admin was notified of the new submission.
        $this->assertDatabaseHas('notifications', [
            'user_id' => $admin->id,
            'type'    => 'guide.application_submitted',
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // 3. Non-guide cannot upload resume
    // ──────────────────────────────────────────────────────────

    public function test_non_guide_cannot_upload_resume(): void
    {
        Storage::fake('local');

        $customer = User::factory()->create(); // role=customer

        $response = $this->actingAs($customer)->postJson('/api/guide/resume', [
            'resume' => UploadedFile::fake()->create('resume.pdf', 500, 'application/pdf'),
        ]);

        // Blocked by role:guide middleware → 403
        $response->assertStatus(403);
    }

    // ──────────────────────────────────────────────────────────
    // 4. Non-PDF rejected
    // ──────────────────────────────────────────────────────────

    public function test_non_pdf_resume_rejected(): void
    {
        Storage::fake('local');

        $guide = $this->makeGuide();
        GuideApplication::create([
            'applicant_user_id' => $guide->id,
            'submission_source' => 'self_signup',
            'status'            => 'pending',
        ]);

        $response = $this->actingAs($guide)->postJson('/api/guide/resume', [
            'resume' => UploadedFile::fake()->create('resume.docx', 500, 'application/msword'),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['resume']);
    }

    // ──────────────────────────────────────────────────────────
    // 5. File >5MB rejected
    // ──────────────────────────────────────────────────────────

    public function test_oversized_resume_rejected(): void
    {
        Storage::fake('local');

        $guide = $this->makeGuide();
        GuideApplication::create([
            'applicant_user_id' => $guide->id,
            'submission_source' => 'self_signup',
            'status'            => 'pending',
        ]);

        // 6 MB, above the 5 MB cap.
        $response = $this->actingAs($guide)->postJson('/api/guide/resume', [
            'resume' => UploadedFile::fake()->create('resume.pdf', 6144, 'application/pdf'),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['resume']);
    }

    // ──────────────────────────────────────────────────────────
    // 6. Admin can list under_review applications
    // ──────────────────────────────────────────────────────────

    public function test_admin_can_list_pending_applications(): void
    {
        $admin = User::factory()->admin()->create();

        $guideA = $this->makeGuide();
        $guideB = $this->makeGuide();

        GuideApplication::create([
            'applicant_user_id' => $guideA->id,
            'submission_source' => 'self_signup',
            'status'            => 'under_review',
        ]);
        GuideApplication::create([
            'applicant_user_id' => $guideB->id,
            'submission_source' => 'self_signup',
            'status'            => 'pending',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/guide-applications?status=under_review');

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.applicant_user_id', $guideA->id);
    }

    // ──────────────────────────────────────────────────────────
    // 7. Admin approves → guide becomes bookable
    // ──────────────────────────────────────────────────────────

    public function test_admin_can_approve_application(): void
    {
        Storage::fake('local');

        $admin = User::factory()->admin()->create();
        $guide = $this->makeGuide();

        $application = GuideApplication::create([
            'applicant_user_id' => $guide->id,
            'submission_source' => 'self_signup',
            'status'            => 'under_review',
        ]);

        $response = $this->actingAs($admin)->postJson(
            "/api/admin/guide-applications/{$application->id}/approve"
        );

        $response->assertOk();

        // Application approved
        $this->assertDatabaseHas('guide_applications', [
            'id'     => $application->id,
            'status' => 'approved',
        ]);

        // User flipped to approved guide
        $this->assertDatabaseHas('users', [
            'id'          => $guide->id,
            'role'        => 'guide',
            'is_approved' => true,
        ]);

        // TourGuide row created with approval_status=approved
        $this->assertDatabaseHas('tour_guides', [
            'user_id'         => $guide->id,
            'approval_status' => 'approved',
            'application_id'  => $application->id,
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // 8. Admin rejects with reason → user demoted
    // ──────────────────────────────────────────────────────────

    public function test_admin_can_reject_with_reason(): void
    {
        $admin = User::factory()->admin()->create();
        $guide = $this->makeGuide();

        $application = GuideApplication::create([
            'applicant_user_id' => $guide->id,
            'submission_source' => 'self_signup',
            'status'            => 'under_review',
        ]);

        $response = $this->actingAs($admin)->postJson(
            "/api/admin/guide-applications/{$application->id}/reject",
            ['rejection_reason' => 'Resume is incomplete.'],
        );

        $response->assertOk();

        $this->assertDatabaseHas('guide_applications', [
            'id'               => $application->id,
            'status'           => 'rejected',
            'rejection_reason' => 'Resume is incomplete.',
        ]);

        // User demoted back to customer (still approved as a customer)
        $this->assertDatabaseHas('users', [
            'id'          => $guide->id,
            'role'        => 'customer',
            'is_approved' => true,
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // 9. Non-admin cannot approve
    // ──────────────────────────────────────────────────────────

    public function test_non_admin_cannot_approve(): void
    {
        $guide = $this->makeGuide();
        $otherUser = User::factory()->create(); // customer

        $application = GuideApplication::create([
            'applicant_user_id' => $guide->id,
            'submission_source' => 'self_signup',
            'status'            => 'under_review',
        ]);

        $response = $this->actingAs($otherUser)->postJson(
            "/api/admin/guide-applications/{$application->id}/approve"
        );

        $response->assertStatus(403);
    }

    // ──────────────────────────────────────────────────────────
    // 10. Owner-created guide is pending and NOT bookable
    // ──────────────────────────────────────────────────────────

    public function test_owner_created_guide_is_pending_and_not_bookable(): void
    {
        Storage::fake('local');

        $owner = User::factory()->owner()->create();
        $customer = User::factory()->create();
        $campsite = Campsite::factory()->create([
            'owner_id'        => $owner->id,
            'capacity'        => 10,
            'price_per_night' => 100,
            'price_unit'      => 'night',
        ]);

        $resume = UploadedFile::fake()->create('resume.pdf', 500, 'application/pdf');

        $response = $this->actingAs($owner)->postJson(
            "/api/owner/campsites/{$campsite->id}/tour-guides",
            [
                'name'           => 'Test Guide',
                'contact_number' => '09171234567',
                'email'          => 'newguide-' . uniqid() . '@example.com',
                'price_per_trip' => 1000,
                'resume'         => $resume,
            ],
        );

        $response->assertStatus(201);

        $guideId = $response->json('guide.id');

        $this->assertDatabaseHas('tour_guides', [
            'id'              => $guideId,
            'approval_status' => 'pending',
        ]);

        // Booking the pending guide should fail.
        $bookingResponse = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id'    => $campsite->id,
            'tour_guide_id'  => $guideId,
            'check_in'       => now()->addDay()->toDateString(),
            'check_out'      => now()->addDays(3)->toDateString(),
            'guests'         => 1,
        ]);

        $bookingResponse->assertStatus(422);
        $bookingResponse->assertJsonValidationErrors(['tour_guide_id']);
    }

    // ──────────────────────────────────────────────────────────
    // 11. Admin-created guide is auto-approved and bookable
    // ──────────────────────────────────────────────────────────

    public function test_admin_created_guide_is_auto_approved_and_bookable(): void
    {
        Storage::fake('local');

        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();
        $campsite = Campsite::factory()->create([
            'capacity'        => 10,
            'price_per_night' => 100,
            'price_unit'      => 'night',
        ]);

        $response = $this->actingAs($admin)->postJson('/api/admin/tour-guides', [
            'name'           => 'Admin Created Guide',
            'contact_number' => '09171234567',
            'email'          => 'admin-created-' . uniqid() . '@example.com',
            'price_per_trip' => 500,
            'campsite_id'    => $campsite->id,
        ]);

        $response->assertStatus(201);

        $guideId = $response->json('guide.id');

        $this->assertDatabaseHas('tour_guides', [
            'id'              => $guideId,
            'approval_status' => 'approved',
        ]);

        $this->assertDatabaseHas('guide_applications', [
            'tour_guide_id'     => $guideId,
            'status'            => 'auto_approved',
            'submission_source' => 'admin_created',
        ]);

        // Booking the approved guide should succeed.
        $bookingResponse = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id'   => $campsite->id,
            'tour_guide_id' => $guideId,
            'check_in'      => now()->addDay()->toDateString(),
            'check_out'     => now()->addDays(3)->toDateString(),
            'guests'        => 1,
        ]);

        $bookingResponse->assertStatus(201);
    }

    // ──────────────────────────────────────────────────────────
    // 12. Owner creates, admin approves, then booking succeeds
    // ──────────────────────────────────────────────────────────

    public function test_owner_created_guide_becomes_bookable_after_approval(): void
    {
        Storage::fake('local');

        $admin = User::factory()->admin()->create();
        $owner = User::factory()->owner()->create();
        $customer = User::factory()->create();
        $campsite = Campsite::factory()->create([
            'owner_id'        => $owner->id,
            'capacity'        => 10,
            'price_per_night' => 100,
            'price_unit'      => 'night',
        ]);

        $resume = UploadedFile::fake()->create('resume.pdf', 500, 'application/pdf');

        $createResponse = $this->actingAs($owner)->postJson(
            "/api/owner/campsites/{$campsite->id}/tour-guides",
            [
                'name'           => 'Pending Guide',
                'contact_number' => '09171234567',
                'email'          => 'pending-guide-' . uniqid() . '@example.com',
                'price_per_trip' => 500,
                'resume'         => $resume,
            ],
        );
        $createResponse->assertStatus(201);
        $guideId = $createResponse->json('guide.id');
        $appId = $createResponse->json('application.id');

        // Booking before approval fails.
        $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id'   => $campsite->id,
            'tour_guide_id' => $guideId,
            'check_in'      => now()->addDay()->toDateString(),
            'check_out'     => now()->addDays(3)->toDateString(),
            'guests'        => 1,
        ])->assertStatus(422);

        // Admin approves.
        $this->actingAs($admin)->postJson(
            "/api/admin/guide-applications/{$appId}/approve"
        )->assertOk();

        // Booking after approval succeeds.
        $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id'   => $campsite->id,
            'tour_guide_id' => $guideId,
            'check_in'      => now()->addDay()->toDateString(),
            'check_out'     => now()->addDays(3)->toDateString(),
            'guests'        => 1,
        ])->assertStatus(201);
    }

    // ──────────────────────────────────────────────────────────
    // 13. Public listing filters non-approved guides
    // ──────────────────────────────────────────────────────────

    public function test_public_listing_hides_non_approved_guides(): void
    {
        $approvedGuide = $this->makeGuide(['is_approved' => true]);
        $pendingGuide = $this->makeGuide();

        $this->makeTourGuide($approvedGuide, ['approval_status' => 'approved']);
        $this->makeTourGuide($pendingGuide, ['approval_status' => 'pending']);

        $response = $this->getJson('/api/tour-guides');

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.user_id', $approvedGuide->id);
    }

    // ──────────────────────────────────────────────────────────
    // 14. Re-upload after approval resets to under_review
    // ──────────────────────────────────────────────────────────

    public function test_reupload_after_approval_resets_to_under_review(): void
    {
        Storage::fake('local');

        $admin = User::factory()->admin()->create();
        $guide = $this->makeGuide(['is_approved' => true]);
        $tourGuide = $this->makeTourGuide($guide, ['approval_status' => 'approved']);

        // Bootstrap: current application is approved.
        $application = GuideApplication::create([
            'applicant_user_id' => $guide->id,
            'submission_source' => 'self_signup',
            'status'            => 'approved',
            'resume_url'        => 'resumes/old.pdf',
        ]);
        $tourGuide->update(['application_id' => $application->id]);

        // Re-upload a new resume.
        $response = $this->actingAs($guide)->postJson('/api/guide/resume', [
            'resume' => UploadedFile::fake()->create('new-resume.pdf', 500, 'application/pdf'),
        ]);

        $response->assertOk();

        // Same application row flipped back to under_review.
        $this->assertDatabaseHas('guide_applications', [
            'id'     => $application->id,
            'status' => 'under_review',
        ]);
    }
}