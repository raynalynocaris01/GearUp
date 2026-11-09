<?php

namespace Tests\Feature;

use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCreateGuideTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_guide_directly_with_auto_approval(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_approved' => true]);

        $response = $this->actingAs($admin)->postJson('/api/admin/tour-guides', [
            'name' => 'New Guide',
            'email' => 'newguide@example.com',
            'contact_number' => '09171234567',
            'price_per_trip' => 1500,
            'location' => 'Valencia',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'newguide@example.com',
            'role' => 'guide',
        ]);
        $this->assertDatabaseHas('tour_guides', [
            'name' => 'New Guide',
            'approval_status' => 'approved',
        ]);
    }

    public function test_non_admin_cannot_create_guide_via_admin_endpoint(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($customer)->postJson('/api/admin/tour-guides', [
            'name' => 'New Guide',
            'email' => 'newguide@example.com',
            'contact_number' => '09171234567',
        ]);

        $response->assertStatus(403);
    }

    public function test_new_admin_created_guide_must_change_password_on_login(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_approved' => true]);

        $response = $this->actingAs($admin)->postJson('/api/admin/tour-guides', [
            'name' => 'New Guide',
            'email' => 'newguide@example.com',
            'contact_number' => '09171234567',
            'price_per_trip' => 1500,
        ]);

        $response->assertCreated();
        $guideUser = User::where('email', 'newguide@example.com')->first();

        $this->assertTrue((bool) $guideUser->password_must_change);
    }
}