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
     * Booking overlapping dates is allowed while total guests stays
     * within the campsite capacity.
     */
    public function test_can_book_overlapping_dates_when_under_capacity(): void
    {
        $campsite = Campsite::factory()->create([
            'capacity' => 4,
            'price_per_night' => 100,
            'price_unit' => 'night',
        ]);

        // First booking: 2 guests, Nov 1 - Nov 5
        Booking::factory()->confirmed()->create([
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-05',
            'guests' => 2,
        ]);

        $customer = User::factory()->create();

        // Second booking: overlapping dates, 2 guests.
        // 2 + 2 = 4 = capacity, so this should succeed.
        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-03',
            'check_out' => '2026-11-07',
            'guests' => 2,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseCount('bookings', 2);
    }

    /**
     * Booking overlapping dates is rejected when total guests would
     * exceed the campsite capacity.
     */
    public function test_cannot_book_overlapping_dates_when_over_capacity(): void
    {
        $campsite = Campsite::factory()->create([
            'capacity' => 4,
            'price_per_night' => 100,
            'price_unit' => 'night',
        ]);

        // First booking: 3 guests, Nov 1 - Nov 5
        Booking::factory()->confirmed()->create([
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-05',
            'guests' => 3,
        ]);

        $customer = User::factory()->create();

        // Second booking: overlapping dates, 2 guests.
        // 3 + 2 = 5 > capacity 4, so this should fail with 1 spot remaining.
        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-03',
            'check_out' => '2026-11-07',
            'guests' => 2,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['guests']);

        // Only the original booking exists
        $this->assertDatabaseCount('bookings', 1);
    }

    /**
     * Booking a campsite that is already fully booked for the dates
     * returns the "fully booked" message.
     */
    public function test_cannot_book_fully_booked_dates(): void
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
            'guests' => 4,
        ]);

        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-03',
            'check_out' => '2026-11-07',
            'guests' => 1,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['guests']);

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