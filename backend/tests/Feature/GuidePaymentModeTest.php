<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuidePaymentModeTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private TourGuide $guide;

    protected function setUp(): void
    {
        parent::setUp();

        $guideUser = User::factory()->create([
            'role' => 'guide',
            'is_approved' => true,
            'password_must_change' => false,
        ]);

        $this->guide = TourGuide::factory()->create([
            'user_id' => $guideUser->id,
            'campsite_id' => null,
            'is_independent' => true,
            'approval_status' => 'approved',
            'price_per_trip' => 1500,
            'payment_mode' => 'online',
            'down_payment_percent' => 20,
        ]);

        $this->customer = User::factory()->create([
            'role' => 'customer',
            'is_approved' => true,
        ]);
    }

    public function test_guide_booking_with_down_payment_splits_total(): void
    {
        $response = $this->actingAs($this->customer)->postJson('/api/bookings', [
            'tour_guide_id' => $this->guide->id,
            'guests' => 1,
            'check_in' => now()->addDay()->toDateString(),
            'check_out' => now()->addDays(2)->toDateString(),
        ]);

        $response->assertCreated();
        $booking = Booking::find($response->json('id'));

        $this->assertEquals(1500.00, (float) $booking->total_price);
        $this->assertEquals(300.00, (float) $booking->amount_paid);
        $this->assertEquals(1200.00, (float) $booking->balance_due);
    }

    public function test_guide_booking_with_zero_down_payment_requires_full_amount(): void
    {
        $this->guide->update(['down_payment_percent' => 0]);

        $response = $this->actingAs($this->customer)->postJson('/api/bookings', [
            'tour_guide_id' => $this->guide->id,
            'guests' => 1,
            'check_in' => now()->addDay()->toDateString(),
            'check_out' => now()->addDays(2)->toDateString(),
        ]);

        $response->assertCreated();
        $booking = Booking::find($response->json('id'));

        $this->assertEquals(1500.00, (float) $booking->total_price);
        $this->assertEquals(0.00, (float) $booking->amount_paid);
        $this->assertEquals(1500.00, (float) $booking->balance_due);
    }

    public function test_guide_booking_with_cash_only_mode_records_cash_payment_method(): void
    {
        $this->guide->update(['payment_mode' => 'pay_at_campsite']);

        $response = $this->actingAs($this->customer)->postJson('/api/bookings', [
            'tour_guide_id' => $this->guide->id,
            'guests' => 1,
            'check_in' => now()->addDay()->toDateString(),
            'check_out' => now()->addDays(2)->toDateString(),
            'payment_method' => 'cash',
        ]);

        $response->assertCreated();
        $booking = Booking::find($response->json('id'));

        $this->assertEquals('cash', $booking->payment_method);
        $this->assertEquals(0.00, (float) $booking->amount_paid);
        $this->assertEquals(1500.00, (float) $booking->balance_due);
    }
}