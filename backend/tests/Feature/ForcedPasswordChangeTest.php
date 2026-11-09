<?php

namespace Tests\Feature;

use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ForcedPasswordChangeTest extends TestCase
{
    use RefreshDatabase;

    private User $guideUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->guideUser = User::factory()->create([
            'role' => 'guide',
            'is_approved' => true,
            'password' => Hash::make('tempPassword123'),
            'password_must_change' => true,
        ]);

        TourGuide::factory()->create([
            'user_id' => $this->guideUser->id,
            'campsite_id' => null,
            'is_independent' => true,
            'approval_status' => 'approved',
        ]);
    }

    public function test_guide_with_password_must_change_can_still_read_own_user(): void
    {
        $response = $this->actingAs($this->guideUser)->getJson('/api/user');
        $response->assertOk();
        $response->assertJsonPath('password_must_change', true);
    }

    public function test_guide_with_password_must_change_is_blocked_from_guide_profile_update(): void
    {
        $response = $this->actingAs($this->guideUser)->putJson('/api/guide/profile', [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('code', 'PASSWORD_CHANGE_REQUIRED');
    }

    public function test_guide_with_password_must_change_is_blocked_from_pickup_update(): void
    {
        $response = $this->actingAs($this->guideUser)->putJson('/api/user/pickup', [
            'pickup_method' => 'meetup',
            'pickup_address' => 'Some address',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('code', 'PASSWORD_CHANGE_REQUIRED');
    }

    public function test_guide_with_password_must_change_can_change_password(): void
    {
        $response = $this->actingAs($this->guideUser)->postJson('/api/user/change-password', [
            'current_password' => 'tempPassword123',
            'password' => 'newPassword456',
            'password_confirmation' => 'newPassword456',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('users', [
            'id' => $this->guideUser->id,
            'password_must_change' => false,
        ]);
    }

    public function test_after_changing_password_guide_can_update_profile(): void
    {
        // First, change password
        $this->actingAs($this->guideUser)->postJson('/api/user/change-password', [
            'current_password' => 'tempPassword123',
            'password' => 'newPassword456',
            'password_confirmation' => 'newPassword456',
        ]);

        // Refresh the user instance
        $this->guideUser->refresh();

        // Now the same write should succeed
        $response = $this->actingAs($this->guideUser)->putJson('/api/guide/profile', [
            'name' => 'Updated Name',
        ]);

        $response->assertOk();
    }
}