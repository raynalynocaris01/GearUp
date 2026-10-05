<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\Campsite;
use App\Models\Event;
use App\Models\GearItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTriggerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A campsite booking notifies the campsite owner.
     */
    public function test_booking_creation_notifies_campsite_owner(): void
    {
        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'price_unit' => 'night',
            'price_per_night' => 100,
        ]);
        $customer = User::factory()->create();

        $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03',
            'guests' => 2,
        ])->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'booking.created',
        ]);

        // The customer should NOT receive a notification for their own action
        $this->assertDatabaseMissing('notifications', [
            'user_id' => $customer->id,
            'type' => 'booking.created',
        ]);
    }

    /**
     * An event registration notifies the event owner.
     */
    public function test_event_registration_notifies_event_owner(): void
    {
        $owner = User::factory()->owner()->create();
        $event = Event::factory()->create([
            'owner_id' => $owner->id,
            'capacity' => 10,
        ]);
        $customer = User::factory()->create();

        $this->actingAs($customer)->postJson(
            "/api/events/{$event->id}/register",
            ['guests' => 1],
        )->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'event.registration',
        ]);
    }

    /**
     * A gear booking notifies the gear owner.
     */
    public function test_gear_booking_notifies_gear_owner(): void
    {
        $owner = User::factory()->create();
        $gear = GearItem::factory()->create([
            'owner_id' => $owner->id,
            'price_per_day' => 50,
            'stock' => 3,
        ]);
        $customer = User::factory()->create();

        $this->actingAs($customer)->postJson('/api/bookings', [
            'gear_item_id' => $gear->id,
            'gear_start_date' => '2026-11-01',
            'gear_end_date' => '2026-11-03',
            'gear_quantity' => 1,
            'guests' => 1,
        ])->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'gear.rented',
        ]);
    }

    /**
     * An owner confirming a booking notifies the customer.
     */
    public function test_owner_confirming_booking_notifies_customer(): void
    {
        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'price_unit' => 'night',
            'price_per_night' => 100,
        ]);
        $customer = User::factory()->create();

        // Customer books
        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03',
            'guests' => 2,
        ]);
        $bookingId = $response->json('id');

        // Clear notifications so we can assert on the confirm one only
        AppNotification::query()->delete();

        // Owner confirms
        $this->actingAs($owner)->postJson(
            "/api/owner/bookings/{$bookingId}/confirm",
        )->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'type' => 'booking.confirmed',
        ]);
    }

    /**
     * Unauthenticated users cannot see any notifications.
     */
    public function test_unauthenticated_cannot_list_notifications(): void
    {
        $this->getJson('/api/notifications')->assertStatus(401);
    }
}