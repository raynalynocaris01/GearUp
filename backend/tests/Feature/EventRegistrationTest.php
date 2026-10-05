<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventRegistrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A customer can register for a published event.
     */
    public function test_customer_can_register_for_event(): void
    {
        $owner = User::factory()->owner()->create();
        $event = Event::factory()->create([
            'owner_id' => $owner->id,
            'capacity' => 10,
            'price_per_person' => 250,
        ]);
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson(
            "/api/events/{$event->id}/register",
            ['guests' => 2],
        );

        $response->assertStatus(201);
        $response->assertJsonPath('status', 'confirmed');
        $response->assertJsonPath('guests', 2);
        $response->assertJsonPath('event_id', $event->id);

        $this->assertDatabaseHas('event_registrations', [
            'user_id' => $customer->id,
            'event_id' => $event->id,
            'guests' => 2,
            'status' => 'confirmed',
        ]);
    }

    /**
     * Registering for more seats than capacity is rejected.
     */
    public function test_cannot_register_beyond_event_capacity(): void
    {
        $event = Event::factory()->create([
            'capacity' => 5,
            'price_per_person' => 100,
        ]);

        // Pre-fill 4 seats with another customer
        $otherCustomer = User::factory()->create();
        EventRegistration::factory()->create([
            'event_id' => $event->id,
            'user_id' => $otherCustomer->id,
            'guests' => 4,
            'status' => 'confirmed',
        ]);

        $customer = User::factory()->create();
        $response = $this->actingAs($customer)->postJson(
            "/api/events/{$event->id}/register",
            ['guests' => 2],
        );

        $response->assertStatus(422);
        $this->assertDatabaseMissing('event_registrations', [
            'user_id' => $customer->id,
            'event_id' => $event->id,
        ]);
    }

    /**
     * A user cannot register twice for the same event.
     */
    public function test_cannot_register_twice_for_same_event(): void
    {
        $event = Event::factory()->create(['capacity' => 10]);
        $customer = User::factory()->create();

        // First registration
        EventRegistration::factory()->create([
            'event_id' => $event->id,
            'user_id' => $customer->id,
            'guests' => 1,
            'status' => 'confirmed',
        ]);

        // Second attempt
        $response = $this->actingAs($customer)->postJson(
            "/api/events/{$event->id}/register",
            ['guests' => 1],
        );

        $response->assertStatus(422);

        // Still only one registration
        $this->assertEquals(
            1,
            EventRegistration::where('event_id', $event->id)
                ->where('user_id', $customer->id)
                ->count(),
        );
    }

    /**
     * Registering for an unpublished event is rejected.
     */
    public function test_cannot_register_for_unpublished_event(): void
    {
        $event = Event::factory()->draft()->create();
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson(
            "/api/events/{$event->id}/register",
            ['guests' => 1],
        );

        $response->assertStatus(422);
        $this->assertDatabaseCount('event_registrations', 0);
    }
}