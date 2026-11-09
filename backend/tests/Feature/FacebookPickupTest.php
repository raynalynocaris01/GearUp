<?php

namespace Tests\Feature;

use App\Models\GearItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacebookPickupTest extends TestCase
{
    use RefreshDatabase;

    public function test_facebook_url_persists_on_pickup_update(): void
    {
        $user = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($user)->putJson('/api/user/pickup', [
            'pickup_method' => 'meetup',
            'pickup_address' => 'Test Address',
            'facebook_url' => 'https://www.facebook.com/testuser',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'facebook_url' => 'https://www.facebook.com/testuser',
        ]);
    }

    public function test_facebook_url_is_returned_on_public_gear_detail(): void
    {
        $owner = User::factory()->create([
            'pickup_method' => 'meetup',
            'pickup_address' => 'Test Address',
            'facebook_url' => 'https://www.facebook.com/ownerfb',
        ]);
        $gear = GearItem::factory()->create(['owner_id' => $owner->id]);

        $response = $this->getJson("/api/gear/{$gear->id}");

        $response->assertOk();
        $response->assertJsonPath('owner.facebook_url', 'https://www.facebook.com/ownerfb');
    }

    public function test_invalid_facebook_url_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($user)->putJson('/api/user/pickup', [
            'pickup_method' => 'meetup',
            'pickup_address' => 'Test Address',
            'facebook_url' => 'not-a-url',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('facebook_url');
    }

    public function test_guide_facebook_url_persists(): void
    {
        $guideUser = User::factory()->create([
            'role' => 'guide',
            'is_approved' => true,
            'password_must_change' => false,
        ]);
        \App\Models\TourGuide::factory()->create([
            'user_id' => $guideUser->id,
            'approval_status' => 'approved',
            'is_independent' => true,
        ]);

        $response = $this->actingAs($guideUser)->putJson('/api/guide/profile', [
            'facebook_url' => 'https://www.facebook.com/guidefb',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('tour_guides', [
            'user_id' => $guideUser->id,
            'facebook_url' => 'https://www.facebook.com/guidefb',
        ]);
    }
}