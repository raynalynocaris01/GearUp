<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\GearItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GearPaymentModeTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private User $renter;
    private GearItem $gear;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'role' => 'customer',
            'is_approved' => true,
        ]);
        $this->renter = User::factory()->create([
            'role' => 'customer',
            'is_approved' => true,
        ]);
        $this->gear = GearItem::factory()->create([
            'owner_id' => $this->renter->id,
            'name' => 'Test Tent',
            'price_per_day' => 100,
            'stock' => 5,
            'is_available' => true,
            'payment_mode' => 'online',
            'down_payment_percent' => 30,
        ]);
    }

    public function test_gear_rental_with_down_payment_splits_total(): void
    {
        $response = $this->actingAs($this->customer)->postJson('/api/bookings', [
            'gear_item_id' => $this->gear->id,
            'gear_quantity' => 1,
            'gear_start_date' => now()->addDay()->toDateString(),
            'gear_end_date' => now()->addDays(3)->toDateString(),
            'guests' => 1,
        ]);

        $response->assertCreated();
        $booking = Booking::find($response->json('id'));

        // 2 days × ₱100 × 1 = ₱200
        $this->assertEquals(200.00, (float) $booking->total_price);
        // 30% of ₱200 = ₱60
        $this->assertEquals(60.00, (float) $booking->amount_paid);
        $this->assertEquals(140.00, (float) $booking->balance_due);
    }

    public function test_gear_rental_with_zero_down_payment_requires_full_amount(): void
    {
        $this->gear->update(['down_payment_percent' => 0]);

        $response = $this->actingAs($this->customer)->postJson('/api/bookings', [
            'gear_item_id' => $this->gear->id,
            'gear_quantity' => 1,
            'gear_start_date' => now()->addDay()->toDateString(),
            'gear_end_date' => now()->addDays(3)->toDateString(),
            'guests' => 1,
        ]);

        $response->assertCreated();
        $booking = Booking::find($response->json('id'));

        $this->assertEquals(200.00, (float) $booking->total_price);
        $this->assertEquals(0.00, (float) $booking->amount_paid);
        $this->assertEquals(200.00, (float) $booking->balance_due);
    }

    public function test_gear_rental_cash_only_mode_records_cash(): void
    {
        $this->gear->update(['payment_mode' => 'pay_at_campsite']);

        $response = $this->actingAs($this->customer)->postJson('/api/bookings', [
            'gear_item_id' => $this->gear->id,
            'gear_quantity' => 1,
            'gear_start_date' => now()->addDay()->toDateString(),
            'gear_end_date' => now()->addDays(3)->toDateString(),
            'guests' => 1,
            'payment_method' => 'cash',
        ]);

        $response->assertCreated();
        $booking = Booking::find($response->json('id'));

        $this->assertEquals('cash', $booking->payment_method);
        $this->assertEquals(0.00, (float) $booking->amount_paid);
        $this->assertEquals(200.00, (float) $booking->balance_due);
    }
}