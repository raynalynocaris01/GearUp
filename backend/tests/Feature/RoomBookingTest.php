<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoomBookingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A customer can book a room variant of a campsite. The booking
     * attaches to the parent campsite (campsite_id) and records the
     * room (room_campsite_id). Pricing uses the room's own rate.
     */
    public function test_customer_can_book_room_variant_on_parent_campsite(): void
    {
        $owner = User::factory()->owner()->create();

        // Parent campsite — priced per entrance, big capacity
        $parent = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'capacity' => 30,
            'price_per_night' => 75,
            'price_unit' => 'entrance',
        ]);

        // Room variant — priced per night, small capacity
        $room = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'parent_campsite_id' => $parent->id,
            'capacity' => 2,
            'price_per_night' => 800,
            'price_unit' => 'night',
        ]);

        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $parent->id,
            'room_campsite_id' => $room->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03', // 2 nights
            'guests' => 2,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('campsite_id', $parent->id);
        $response->assertJsonPath('room_campsite_id', $room->id);
        $response->assertJsonPath('guests', 2);

        // Room rate × nights only (no guests multiplier, no entrance fee)
        $this->assertEquals(1600.00, (float) $response->json('total_price'));

        $this->assertDatabaseHas('bookings', [
            'user_id' => $customer->id,
            'campsite_id' => $parent->id,
            'room_campsite_id' => $room->id,
            'status' => 'pending',
            'guests' => 2,
        ]);
    }

    /**
     * A room can only be booked on its own parent campsite.
     */
    public function test_cannot_book_room_on_unrelated_campsite(): void
    {
        $ownerA = User::factory()->owner()->create();
        $ownerB = User::factory()->owner()->create();

        $parentA = Campsite::factory()->create([
            'owner_id' => $ownerA->id,
            'capacity' => 30,
            'price_per_night' => 75,
            'price_unit' => 'entrance',
        ]);

        $roomOfA = Campsite::factory()->create([
            'owner_id' => $ownerA->id,
            'parent_campsite_id' => $parentA->id,
            'capacity' => 2,
            'price_per_night' => 800,
            'price_unit' => 'night',
        ]);

        // Different campsite — not the room's parent
        $parentB = Campsite::factory()->create([
            'owner_id' => $ownerB->id,
            'capacity' => 20,
            'price_per_night' => 100,
            'price_unit' => 'night',
        ]);

        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $parentB->id,
            'room_campsite_id' => $roomOfA->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03',
            'guests' => 2,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['room_campsite_id']);

        $this->assertDatabaseCount('bookings', 0);
    }

    /**
     * Room capacity — not the parent's — is the ceiling for guest count.
     */
    public function test_cannot_exceed_room_capacity(): void
    {
        $owner = User::factory()->owner()->create();

        $parent = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'capacity' => 30,
            'price_per_night' => 75,
            'price_unit' => 'entrance',
        ]);

        $room = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'parent_campsite_id' => $parent->id,
            'capacity' => 2,
            'price_per_night' => 800,
            'price_unit' => 'night',
        ]);

        $customer = User::factory()->create();

        // 5 guests > room capacity 2, even though parent allows 30
        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $parent->id,
            'room_campsite_id' => $room->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03',
            'guests' => 5,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['guests']);

        $this->assertDatabaseCount('bookings', 0);
    }
}