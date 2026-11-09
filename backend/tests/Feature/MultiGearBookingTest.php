<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\GearItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiGearBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_multiple_gear_items_sum_correctly(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'is_approved' => true]);
        $customer = User::factory()->create(['role' => 'customer', 'is_approved' => true]);

        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'price_per_night' => 500,
            'capacity' => 4,
            'is_available' => true,
        ]);

        $gear1 = GearItem::factory()->create([
            'owner_id' => $owner->id,
            'name' => 'Tent',
            'price_per_day' => 100,
            'stock' => 5,
            'is_available' => true,
        ]);
        $gear2 = GearItem::factory()->create([
            'owner_id' => $owner->id,
            'name' => 'Table',
            'price_per_day' => 50,
            'stock' => 5,
            'is_available' => true,
        ]);

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => now()->addDay()->toDateString(),
            'check_out' => now()->addDays(3)->toDateString(),
            'guests' => 1,
            'gear_items' => [
                ['gear_item_id' => $gear1->id, 'quantity' => 1],
                ['gear_item_id' => $gear2->id, 'quantity' => 2],
            ],
        ]);

        $response->assertCreated();
        $booking = Booking::find($response->json('id'));

        // 2 nights × 500 = 1000 (campsite)
        // 2 days × 100 × 1 = 200 (gear1)
        // 2 days × 50 × 2 = 200 (gear2)
        // Total = 1400
        $this->assertEquals(1400.00, (float) $booking->total_price);
        $this->assertCount(2, $booking->gearItems);
    }

    public function test_duplicate_gear_item_merges_quantities(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'is_approved' => true]);
        $customer = User::factory()->create(['role' => 'customer', 'is_approved' => true]);

        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'price_per_night' => 500,
            'capacity' => 4,
            'is_available' => true,
        ]);
        $gear = GearItem::factory()->create([
            'owner_id' => $owner->id,
            'price_per_day' => 100,
            'stock' => 10,
            'is_available' => true,
        ]);

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => now()->addDay()->toDateString(),
            'check_out' => now()->addDays(3)->toDateString(),
            'guests' => 1,
            'gear_items' => [
                ['gear_item_id' => $gear->id, 'quantity' => 2],
                ['gear_item_id' => $gear->id, 'quantity' => 3],
            ],
        ]);

        $response->assertCreated();
        $booking = Booking::find($response->json('id'));

        // Merged: qty 5 × 2 days × 100 = 1000 (gear)
        // + 2 nights × 500 = 1000 (campsite)
        // Total = 2000
        $this->assertEquals(2000.00, (float) $booking->total_price);
        $this->assertCount(1, $booking->gearItems);
        $this->assertEquals(5, $booking->gearItems->first()->pivot->quantity);
    }
}