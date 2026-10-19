<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuideBookingTest extends TestCase
{
    use RefreshDatabase;

    private function makeApprovedGuide(): array
    {
        $user = User::factory()->create([
            'role' => 'guide',
            'is_approved' => true,
        ]);

        $profile = TourGuide::create([
            'user_id' => $user->id,
            'created_by' => $user->id,
            'campsite_id' => null,
            'name' => $user->name,
            'contact_number' => '09171234567',
            'email' => $user->email,
            'description' => 'Test guide',
            'price_per_trip' => 1000.00,
            'is_independent' => true,
            'location' => 'Test',
        ]);

        return [$user, $profile];
    }

    private function makeGuideBooking(TourGuide $guide, string $guideStatus = 'pending'): Booking
    {
        return Booking::factory()->create([
            'tour_guide_id' => $guide->id,
            'guide_status' => $guideStatus,
        ]);
    }

    public function test_guide_can_list_own_bookings(): void
    {
        [$guideUser, $guideProfile] = $this->makeApprovedGuide();
        $booking = $this->makeGuideBooking($guideProfile);

        $response = $this->actingAs($guideUser)->getJson('/api/guide/bookings');

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.id', $booking->id);
    }

    public function test_guide_cannot_see_other_guides_bookings(): void
    {
        [, $profileA] = $this->makeApprovedGuide();
        [$guideB] = $this->makeApprovedGuide();

        $booking = $this->makeGuideBooking($profileA);

        $this->actingAs($guideB)
            ->getJson("/api/guide/bookings/{$booking->id}")
            ->assertStatus(403);
    }

    public function test_guide_can_accept_booking(): void
    {
        [$guideUser, $guideProfile] = $this->makeApprovedGuide();
        $booking = $this->makeGuideBooking($guideProfile);

        $this->actingAs($guideUser)
            ->putJson("/api/guide/bookings/{$booking->id}/accept")
            ->assertOk();

        $this->assertEquals('accepted', $booking->fresh()->guide_status);
    }

    public function test_guide_can_decline_booking(): void
    {
        [$guideUser, $guideProfile] = $this->makeApprovedGuide();
        $booking = $this->makeGuideBooking($guideProfile);

        $this->actingAs($guideUser)
            ->putJson("/api/guide/bookings/{$booking->id}/decline")
            ->assertOk();

        $this->assertEquals('declined', $booking->fresh()->guide_status);
    }

    public function test_declining_booking_removes_guide_fee_from_total(): void
    {
        [$guideUser, $guideProfile] = $this->makeApprovedGuide();
        // makeApprovedGuide creates a guide with price_per_trip = 1000
        $booking = $this->makeGuideBooking($guideProfile);

        // Override the total to simulate a booking that included the guide fee
        $booking->update(['total_price' => 1500]); // 500 campsite + 1000 guide

        $this->actingAs($guideUser)
            ->putJson("/api/guide/bookings/{$booking->id}/decline")
            ->assertOk();

        $fresh = $booking->fresh();
        $this->assertEquals('declined', $fresh->guide_status);
        // Guide reference is preserved so the guide can see declined bookings
        // in their dashboard history.
        $this->assertEquals($guideProfile->id, $fresh->tour_guide_id);
        // 1500 - 1000 (guide fee) = 500
        $this->assertEquals(500.0, (float) $fresh->total_price);
    }

    public function test_guide_cannot_accept_already_accepted_booking(): void
    {
        [$guideUser, $guideProfile] = $this->makeApprovedGuide();
        $booking = $this->makeGuideBooking($guideProfile, 'accepted');

        $this->actingAs($guideUser)
            ->putJson("/api/guide/bookings/{$booking->id}/accept")
            ->assertStatus(422);
    }

    public function test_guide_can_update_own_profile(): void
    {
        [$guideUser] = $this->makeApprovedGuide();

        $this->actingAs($guideUser)
            ->putJson('/api/guide/profile', [
                'price_per_trip' => 2000,
                'description' => 'Updated description',
                'location' => 'Bacolod',
                'contact_number' => '09998887777',
            ])
            ->assertOk()
            ->assertJsonPath('location', 'Bacolod');
    }

    public function test_unapproved_guide_blocked_by_middleware(): void
    {
        $user = User::factory()->create([
            'role' => 'guide',
            'is_approved' => false,
        ]);

        $this->actingAs($user)
            ->getJson('/api/guide/bookings')
            ->assertStatus(403)
            ->assertJsonPath('code', 'pending_approval');
    }
}