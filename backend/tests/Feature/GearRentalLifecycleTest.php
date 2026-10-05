<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\GearItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GearRentalLifecycleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A customer (any authenticated user) can list their own gear.
     */
    public function test_customer_can_list_own_gear(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/my/gear', [
            'name' => 'My Old Tent',
            'category' => 'Tent',
            'price_per_day' => 75,
            'stock' => 1,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('name', 'My Old Tent');
        $response->assertJsonPath('owner_id', $customer->id);
        $response->assertJsonPath('is_available', true);

        $this->assertDatabaseHas('gear_items', [
            'owner_id' => $customer->id,
            'name' => 'My Old Tent',
        ]);
    }

    /**
     * A gear host sees bookings on their own gear.
     */
    public function test_host_sees_bookings_on_their_gear(): void
    {
        $host = User::factory()->create();
        $gear = GearItem::factory()->create([
            'owner_id' => $host->id,
            'price_per_day' => 50,
            'stock' => 3,
        ]);

        Booking::factory()->create([
            'gear_item_id' => $gear->id,
            'campsite_id' => null,
            'check_in' => null,
            'check_out' => null,
            'gear_start_date' => '2026-11-01',
            'gear_end_date' => '2026-11-03',
            'gear_quantity' => 1,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($host)->getJson('/api/my/gear-bookings');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.gear_item.id', $gear->id);
        $response->assertJsonPath('0.status', 'pending');
    }

    /**
     * Host can confirm a pending rental.
     */
    public function test_host_can_confirm_pending_rental(): void
    {
        $host = User::factory()->create();
        $gear = GearItem::factory()->create(['owner_id' => $host->id]);
        $booking = Booking::factory()->create([
            'gear_item_id' => $gear->id,
            'campsite_id' => null,
            'check_in' => null,
            'check_out' => null,
            'gear_start_date' => '2026-11-01',
            'gear_end_date' => '2026-11-03',
            'gear_quantity' => 1,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($host)->postJson(
            "/api/my/gear-bookings/{$booking->id}/confirm",
        );

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'confirmed');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'confirmed',
        ]);
    }

    /**
     * Host can mark a confirmed rental complete.
     */
    public function test_host_can_complete_confirmed_rental(): void
    {
        $host = User::factory()->create();
        $gear = GearItem::factory()->create(['owner_id' => $host->id]);
        $booking = Booking::factory()->create([
            'gear_item_id' => $gear->id,
            'campsite_id' => null,
            'check_in' => null,
            'check_out' => null,
            'gear_start_date' => '2026-11-01',
            'gear_end_date' => '2026-11-03',
            'gear_quantity' => 1,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($host)->postJson(
            "/api/my/gear-bookings/{$booking->id}/complete",
        );

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'completed');
    }

    /**
     * A non-owner cannot act on someone else's gear rental.
     */
    public function test_non_owner_cannot_confirm_rental(): void
    {
        $realHost = User::factory()->create();
        $otherUser = User::factory()->create();
        $gear = GearItem::factory()->create(['owner_id' => $realHost->id]);
        $booking = Booking::factory()->create([
            'gear_item_id' => $gear->id,
            'campsite_id' => null,
            'check_in' => null,
            'check_out' => null,
            'gear_start_date' => '2026-11-01',
            'gear_end_date' => '2026-11-03',
            'gear_quantity' => 1,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($otherUser)->postJson(
            "/api/my/gear-bookings/{$booking->id}/confirm",
        );

        $response->assertStatus(403);

        // Status unchanged
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'pending',
        ]);
    }

    /**
     * The full lifecycle — create gear, rent it, confirm, complete.
     */
    public function test_full_p2p_rental_lifecycle(): void
    {
        // 1. Host lists gear
        $host = User::factory()->create();
        $listResponse = $this->actingAs($host)->postJson('/api/my/gear', [
            'name' => 'Camp Stove',
            'category' => 'Cooking',
            'price_per_day' => 30,
            'stock' => 1,
        ]);
        $gearId = $listResponse->json('id');

        // 2. Renter rents it
        $renter = User::factory()->create();
        $bookResponse = $this->actingAs($renter)->postJson('/api/bookings', [
            'gear_item_id' => $gearId,
            'gear_start_date' => '2026-11-01',
            'gear_end_date' => '2026-11-03',
            'gear_quantity' => 1,
            'guests' => 1,
        ]);
        $bookResponse->assertStatus(201);
        $bookingId = $bookResponse->json('id');

        // 3. Host confirms
        $this->actingAs($host)
            ->postJson("/api/my/gear-bookings/{$bookingId}/confirm")
            ->assertStatus(200)
            ->assertJsonPath('status', 'confirmed');

        // 4. Host completes
        $this->actingAs($host)
            ->postJson("/api/my/gear-bookings/{$bookingId}/complete")
            ->assertStatus(200)
            ->assertJsonPath('status', 'completed');

        // 5. Final state
        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => 'completed',
        ]);
    }
}