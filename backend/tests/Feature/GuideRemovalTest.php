<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuideRemovalTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $guideUser;
    private Campsite $campsite;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'owner', 'is_approved' => true]);
        $this->guideUser = User::factory()->create([
            'role' => 'guide',
            'is_approved' => true,
            'password_must_change' => false,
        ]);
        $this->campsite = Campsite::factory()->create(['owner_id' => $this->owner->id]);
    }

    public function test_owner_can_detach_attached_guide_without_deleting_user(): void
    {
        $guide = TourGuide::factory()->create([
            'campsite_id' => $this->campsite->id,
            'is_independent' => false,
            'user_id' => $this->guideUser->id,
            'approval_status' => 'approved',
        ]);

        $response = $this->actingAs($this->owner)
            ->deleteJson("/api/owner/tour-guides/{$guide->id}");

        $response->assertOk();
        $this->assertDatabaseHas('tour_guides', ['id' => $guide->id, 'campsite_id' => null]);
        // User account is still active
        $this->assertDatabaseHas('users', ['id' => $this->guideUser->id, 'is_suspended' => false]);
    }

    public function test_owner_cannot_delete_guide_with_active_bookings(): void
    {
        $guide = TourGuide::factory()->create([
            'campsite_id' => null,
            'is_independent' => true,
            'user_id' => $this->guideUser->id,
            'approval_status' => 'approved',
            'created_by' => $this->owner->id,  // ← add this
        ]);

        Booking::factory()->create([
            'tour_guide_id' => $guide->id,
            'user_id' => $this->guideUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->owner)
            ->deleteJson("/api/owner/tour-guides/{$guide->id}");

        $response->assertStatus(409);
        $this->assertDatabaseHas('tour_guides', ['id' => $guide->id]);
    }

    public function test_owner_can_delete_independent_guide_with_no_bookings(): void
    {
        $guide = TourGuide::factory()->create([
            'campsite_id' => null,
            'is_independent' => true,
            'user_id' => $this->guideUser->id,
            'approval_status' => 'approved',
            'created_by' => $this->owner->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->deleteJson("/api/owner/tour-guides/{$guide->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('tour_guides', ['id' => $guide->id]);
    }

    public function test_deleted_guide_user_account_is_suspended(): void
    {
        $guide = TourGuide::factory()->create([
            'campsite_id' => null,
            'is_independent' => true,
            'user_id' => $this->guideUser->id,
            'approval_status' => 'approved',
            'created_by' => $this->owner->id,
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/tour-guides/{$guide->id}");

        $this->assertDatabaseHas('users', [
            'id' => $this->guideUser->id,
            'is_suspended' => true,
        ]);
    }

    public function test_suspended_guide_cannot_login(): void
    {
        $this->guideUser->update(['is_suspended' => true]);

        $response = $this->postJson('/api/login', [
            'email' => $this->guideUser->email,
            'password' => 'password',
            'device_name' => 'test',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }
}