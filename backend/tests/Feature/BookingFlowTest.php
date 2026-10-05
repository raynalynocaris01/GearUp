<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingFlowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A customer can book an available campsite.
     */
    public function test_customer_can_book_available_campsite(): void
    {
        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'capacity' => 4,
            'price_per_night' => 100,
            'price_unit' => 'night',
        ]);
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03',
            'guests' => 2,
            'notes' => 'Late arrival',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('status', 'pending');
        $response->assertJsonPath('campsite_id', $campsite->id);
        $response->assertJsonPath('guests', 2);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $customer->id,
            'campsite_id' => $campsite->id,
            'status' => 'pending',
            'guests' => 2,
        ]);
    }

    /**
     * Booking overlapping dates on the same campsite is rejected.
     */
    public function test_cannot_book_campsite_with_overlapping_dates(): void
    {
        $campsite = Campsite::factory()->create([
            'capacity' => 4,
            'price_per_night' => 100,
            'price_unit' => 'night',
        ]);

        Booking::factory()->confirmed()->create([
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-05',
        ]);

        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-03',
            'check_out' => '2026-11-07',
            'guests' => 2,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['check_in']);

        // Only the original booking exists
        $this->assertDatabaseCount('bookings', 1);
    }

    /**
     * Booking more guests than the campsite capacity is rejected.
     */
    public function test_cannot_book_more_guests_than_capacity(): void
    {
        $campsite = Campsite::factory()->create([
            'capacity' => 2,
            'price_per_night' => 100,
            'price_unit' => 'night',
        ]);
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03',
            'guests' => 5,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['guests']);

        $this->assertDatabaseCount('bookings', 0);
    }
}