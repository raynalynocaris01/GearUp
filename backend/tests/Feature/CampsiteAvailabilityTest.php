<?php

namespace Tests\Feature;

use App\Models\Campsite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampsiteAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A campsite marked unavailable cannot be booked.
     */
    public function test_cannot_book_unavailable_campsite(): void
    {
        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'capacity' => 4,
            'price_per_night' => 100,
            'price_unit' => 'night',
            'is_available' => false,
        ]);

        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-12-01',
            'check_out' => '2026-12-03',
            'guests' => 2,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['campsite_id']);

        $this->assertDatabaseCount('bookings', 0);
    }

    /**
     * A room on an unavailable parent campsite cannot be booked either.
     */
    public function test_cannot_book_room_on_unavailable_parent(): void
    {
        $owner = User::factory()->owner()->create();

        $parent = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'capacity' => 30,
            'price_per_night' => 75,
            'price_unit' => 'entrance',
            'is_available' => false,
        ]);

        $room = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'parent_campsite_id' => $parent->id,
            'capacity' => 2,
            'price_per_night' => 800,
            'price_unit' => 'night',
            'is_available' => true,
        ]);

        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $parent->id,
            'room_campsite_id' => $room->id,
            'check_in' => '2026-12-01',
            'check_out' => '2026-12-03',
            'guests' => 2,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['campsite_id']);

        $this->assertDatabaseCount('bookings', 0);
    }

    /**
     * An available campsite still books fine (no regression from the
     * new check).
     */
    public function test_can_book_available_campsite_after_availability_feature(): void
    {
        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'capacity' => 4,
            'price_per_night' => 100,
            'price_unit' => 'night',
            'is_available' => true,
        ]);

        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-12-01',
            'check_out' => '2026-12-03',
            'guests' => 2,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseCount('bookings', 1);
    }

    /**
     * Owner can toggle is_available via the update endpoint.
     */
    public function test_owner_can_toggle_campsite_availability(): void
    {
        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'is_available' => true,
        ]);

        $response = $this->actingAs($owner)->putJson(
            "/api/owner/campsites/{$campsite->id}",
            ['is_available' => false],
        );

        $response->assertStatus(200);
        $response->assertJsonPath('is_available', false);

        $this->assertDatabaseHas('campsites', [
            'id' => $campsite->id,
            'is_available' => false,
        ]);
    }
}