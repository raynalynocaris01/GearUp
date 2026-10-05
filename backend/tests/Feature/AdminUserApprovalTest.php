<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserApprovalTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Admin can approve a pending owner.
     */
    public function test_admin_can_approve_pending_owner(): void
    {
        $admin = User::factory()->admin()->create();
        $owner = User::factory()->pendingOwner()->create();

        $this->assertFalse($owner->is_approved);

        $response = $this->actingAs($admin)->postJson(
            "/api/admin/users/{$owner->id}/approve",
        );

        $response->assertStatus(200);
        $response->assertJsonPath('is_approved', true);

        $this->assertDatabaseHas('users', [
            'id' => $owner->id,
            'is_approved' => true,
        ]);

        // Owner gets a notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'account.approved',
        ]);
    }

    /**
     * Admin can reject a pending owner (sends them back to customer role).
     */
    public function test_admin_can_reject_pending_owner(): void
    {
        $admin = User::factory()->admin()->create();
        $owner = User::factory()->pendingOwner()->create();

        $response = $this->actingAs($admin)->postJson(
            "/api/admin/users/{$owner->id}/reject",
        );

        $response->assertStatus(200);
        $response->assertJsonPath('role', 'customer');
        $response->assertJsonPath('is_approved', true);

        $this->assertDatabaseHas('users', [
            'id' => $owner->id,
            'role' => 'customer',
        ]);

        // Owner gets a notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'account.rejected',
        ]);
    }

    /**
     * Admin can suspend a user and their tokens are revoked.
     */
    public function test_admin_can_suspend_user_and_revoke_tokens(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        // Give the user a token to verify it gets revoked
        $user->createToken('test-device');
        $this->assertDatabaseCount('personal_access_tokens', 1);

        $response = $this->actingAs($admin)->postJson(
            "/api/admin/users/{$user->id}/suspend",
        );

        $response->assertStatus(200);
        $response->assertJsonPath('is_suspended', true);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_suspended' => true,
        ]);

        // Tokens revoked
        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Notification sent
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'account.suspended',
        ]);
    }

    /**
     * Non-admin users cannot approve owners.
     */
    public function test_non_admin_cannot_approve_owner(): void
    {
        $customer = User::factory()->create();
        $owner = User::factory()->pendingOwner()->create();

        $response = $this->actingAs($customer)->postJson(
            "/api/admin/users/{$owner->id}/approve",
        );

        $response->assertStatus(403);

        // Owner is still pending
        $this->assertDatabaseHas('users', [
            'id' => $owner->id,
            'is_approved' => false,
        ]);
    }

    /**
     * Admin cannot suspend another admin.
     */
    public function test_admin_cannot_suspend_another_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $otherAdmin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson(
            "/api/admin/users/{$otherAdmin->id}/suspend",
        );

        $response->assertStatus(403);

        // Target admin still not suspended
        $this->assertDatabaseHas('users', [
            'id' => $otherAdmin->id,
            'is_suspended' => false,
        ]);
    }
}