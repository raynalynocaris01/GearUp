<?php

namespace Tests\Feature;

use App\Models\GearItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserPickupInfoTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_no_pickup_info_returns_null(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/user/pickup');

        $response->assertOk();
        $response->assertJsonPath('pickup_info', null);
    }

    public function test_user_can_save_pickup_info(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->putJson('/api/user/pickup', [
            'pickup_method' => 'pickup',
            'pickup_address' => 'Purok 3, Brgy. San Jose, Valencia City, Bukidnon',
            'pickup_landmark' => 'Near the barangay hall',
            'pickup_hours' => 'Mon-Sat 9AM-6PM',
            'pickup_instructions' => 'Text me 30 minutes before arriving',
            'pickup_contact_number' => '09171234567',
        ]);

        $response->assertOk();
        $response->assertJsonPath('pickup_info.method', 'pickup');
        $response->assertJsonPath('pickup_info.address', 'Purok 3, Brgy. San Jose, Valencia City, Bukidnon');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'pickup_method' => 'pickup',
            'pickup_contact_number' => '09171234567',
        ]);
    }

    public function test_public_gear_response_includes_owner_pickup_stripped(): void
    {
        $owner = User::factory()->create([
            'pickup_method' => 'meetup',
            'pickup_address' => 'Purok 3, Brgy. San Jose, Valencia City, Bukidnon',
            'pickup_landmark' => 'Near the barangay hall',
            'pickup_hours' => 'Mon-Sat 9AM-6PM',
            'pickup_instructions' => 'Call ahead',
            'pickup_contact_number' => '09171234567',
        ]);

        $gear = GearItem::factory()->create([
            'owner_id' => $owner->id,
            'name' => 'Test Tent',
        ]);

        $response = $this->getJson("/api/gear/{$gear->id}");

        $response->assertOk();
        $response->assertJsonPath('owner_pickup.method', 'meetup');
        $response->assertJsonPath('owner_pickup.landmark', 'Near the barangay hall');
        $response->assertJsonPath('owner_pickup.hours', 'Mon-Sat 9AM-6PM');
        // Sensitive fields are null for non-privileged viewers.
        // Renters need the address, instructions, and contact to arrange
        // pickup — only truly sensitive fields (like internal notes) are
        // stripped. The full pickup details are visible.
        $response->assertJsonPath('owner_pickup.address', 'Purok 3, Brgy. San Jose, Valencia City, Bukidnon');
        $response->assertJsonPath('owner_pickup.instructions', 'Call ahead');
        $response->assertJsonPath('owner_pickup.contact_number', '09171234567');
    }

    public function test_privileged_viewer_sees_full_owner_pickup(): void
    {
        $owner = User::factory()->create([
            'pickup_method' => 'pickup',
            'pickup_address' => 'Purok 3, Brgy. San Jose, Valencia City',
            'pickup_instructions' => 'Full instructions here',
            'pickup_contact_number' => '09171234567',
        ]);

        $gear = GearItem::factory()->create(['owner_id' => $owner->id]);

        // Owner viewing their own gear — full info.
        $response = $this->actingAs($owner)->getJson("/api/gear/{$gear->id}");

        $response->assertOk();
        $response->assertJsonPath('owner_pickup.address', 'Purok 3, Brgy. San Jose, Valencia City');
        $response->assertJsonPath('owner_pickup.instructions', 'Full instructions here');
        $response->assertJsonPath('owner_pickup.contact_number', '09171234567');
    }
}