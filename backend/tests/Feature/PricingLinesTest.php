<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\PricingLine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingLinesTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // CRUD
    // ------------------------------------------------------------------

    public function test_owner_can_list_pricing_lines(): void
    {
        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'pricing_mode' => 'detailed',
        ]);
        PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Visitor fee (adult)',
            'amount' => 30,
            'unit' => 'per_person',
            'applies_to' => 'adult',
            'is_optional' => false,
            'sort_order' => 0,
        ]);

        $response = $this->actingAs($owner)->getJson(
            "/api/owner/campsites/{$campsite->id}/pricing-lines"
        );

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.label', 'Visitor fee (adult)');
    }

    public function test_owner_can_create_pricing_line(): void
    {
        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'pricing_mode' => 'detailed',
        ]);

        $response = $this->actingAs($owner)->postJson(
            "/api/owner/campsites/{$campsite->id}/pricing-lines",
            [
                'label' => 'Tent rental',
                'amount' => 500,
                'unit' => 'per_tent',
                'is_optional' => true,
                'description' => 'Bring your own or rent',
                'sort_order' => 0,
            ]
        );

        $response->assertStatus(201);
        $response->assertJsonPath('label', 'Tent rental');
        $response->assertJsonPath('unit', 'per_tent');
        $this->assertDatabaseHas('pricing_lines', [
            'campsite_id' => $campsite->id,
            'label' => 'Tent rental',
        ]);
    }

    public function test_owner_can_update_pricing_line(): void
    {
        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'pricing_mode' => 'detailed',
        ]);
        $line = PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Camping fee',
            'amount' => 75,
            'unit' => 'per_person',
            'applies_to' => 'any',
            'is_optional' => false,
            'sort_order' => 0,
        ]);

        $response = $this->actingAs($owner)->putJson(
            "/api/owner/pricing-lines/{$line->id}",
            ['amount' => 80]
        );

        $response->assertOk();
        $this->assertEquals(80.0, (float) $response->json('amount'));
        $this->assertDatabaseHas('pricing_lines', [
            'id' => $line->id,
            'amount' => 80,
        ]);
    }

    public function test_non_owner_cannot_modify_pricing_line(): void
    {
        $owner = User::factory()->owner()->create();
        $other = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'pricing_mode' => 'detailed',
        ]);
        $line = PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Fee',
            'amount' => 10,
            'unit' => 'flat',
            'applies_to' => 'any',
            'is_optional' => false,
            'sort_order' => 0,
        ]);

        $response = $this->actingAs($other)->putJson(
            "/api/owner/pricing-lines/{$line->id}",
            ['amount' => 999]
        );

        $response->assertStatus(403);
    }

    // ------------------------------------------------------------------
    // Delete protection
    // ------------------------------------------------------------------

    public function test_cannot_delete_pricing_line_used_by_booking(): void
    {
        $owner = User::factory()->owner()->create();
        $customer = User::factory()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'pricing_mode' => 'detailed',
            'capacity' => 10,
        ]);
        PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Camping fee',
            'amount' => 100,
            'unit' => 'flat',
            'applies_to' => 'any',
            'is_optional' => false,
            'sort_order' => 0,
        ]);

        // Create a booking that consumes the line
        $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03',
            'guests' => 1,
            'adults' => 1,
        ])->assertStatus(201);

        $line = PricingLine::where('campsite_id', $campsite->id)->firstOrFail();

        $response = $this->actingAs($owner)->deleteJson(
            "/api/owner/pricing-lines/{$line->id}"
        );

        $response->assertStatus(422);
        $this->assertDatabaseHas('pricing_lines', ['id' => $line->id]);
    }

    public function test_can_delete_pricing_line_never_used(): void
    {
        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'pricing_mode' => 'detailed',
        ]);
        $line = PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Unused',
            'amount' => 5,
            'unit' => 'flat',
            'applies_to' => 'any',
            'is_optional' => false,
            'sort_order' => 0,
        ]);

        $response = $this->actingAs($owner)->deleteJson(
            "/api/owner/pricing-lines/{$line->id}"
        );

        $response->assertOk();
        $this->assertDatabaseMissing('pricing_lines', ['id' => $line->id]);
    }

    // ------------------------------------------------------------------
    // Detailed-mode booking math
    // ------------------------------------------------------------------

    public function test_detailed_booking_computes_mandatory_lines(): void
    {
        $owner = User::factory()->owner()->create();
        $customer = User::factory()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'pricing_mode' => 'detailed',
            'capacity' => 20,
            'price_per_night' => 0,
        ]);
        // Adults: 30 × 2 = 60
        PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Visitor fee (adult)',
            'amount' => 30,
            'unit' => 'per_person',
            'applies_to' => 'adult',
            'is_optional' => false,
            'sort_order' => 0,
        ]);
        // Any: 20 × (2 adults + 1 child) = 60
        PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Camping fee',
            'amount' => 20,
            'unit' => 'per_person',
            'applies_to' => 'any',
            'is_optional' => false,
            'sort_order' => 1,
        ]);
        // Flat: 100 × 1 = 100
        PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Booking fee',
            'amount' => 100,
            'unit' => 'flat',
            'applies_to' => 'any',
            'is_optional' => false,
            'sort_order' => 2,
        ]);

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03', // 2 nights (not used by flat/per_person)
            'guests' => 3,
            'adults' => 2,
            'children' => 1,
        ]);

        $response->assertStatus(201);
        // 60 + 60 + 100 = 220
        $this->assertEquals(220.0, (float) $response->json('total_price'));
    }

    public function test_detailed_booking_includes_selected_optional_per_tent_line(): void
    {
        $owner = User::factory()->owner()->create();
        $customer = User::factory()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'pricing_mode' => 'detailed',
            'capacity' => 20,
            'price_per_night' => 0,
        ]);
        $mandatory = PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Camping fee',
            'amount' => 50,
            'unit' => 'flat',
            'applies_to' => 'any',
            'is_optional' => false,
            'sort_order' => 0,
        ]);
        $optional = PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Tent rental',
            'amount' => 500,
            'unit' => 'per_tent',
            'applies_to' => 'any',
            'is_optional' => true,
            'sort_order' => 1,
        ]);

        // 1) Book WITHOUT the optional tent rental
        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03',
            'guests' => 1,
            'adults' => 1,
        ]);
        $response->assertStatus(201);
        $this->assertEquals(50.0, (float) $response->json('total_price'));

        // 2) Book WITH 2 × tent rental = 50 + 500×2 = 1050
        $customer2 = User::factory()->create();
        $response2 = $this->actingAs($customer2)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-05',
            'check_out' => '2026-11-07',
            'guests' => 1,
            'adults' => 1,
            'pricing_lines' => [
                ['pricing_line_id' => $optional->id, 'quantity' => 2],
            ],
        ]);
        $response2->assertStatus(201);
        $this->assertEquals(1050.0, (float) $response2->json('total_price'));
    }

    public function test_detailed_booking_guest_categories_drive_per_person_subtotals(): void
    {
        $owner = User::factory()->owner()->create();
        $customer = User::factory()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'pricing_mode' => 'detailed',
            'capacity' => 20,
            'price_per_night' => 0,
        ]);
        // Adult fee: 30 per adult → 2 adults = 60
        PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Adult',
            'amount' => 30,
            'unit' => 'per_person',
            'applies_to' => 'adult',
            'is_optional' => false,
            'sort_order' => 0,
        ]);
        // Child fee: 15 per child → 1 child = 15
        PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Child',
            'amount' => 15,
            'unit' => 'per_person',
            'applies_to' => 'child',
            'is_optional' => false,
            'sort_order' => 1,
        ]);
        // Senior fee: 20 per senior → 1 senior = 20
        PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Senior',
            'amount' => 20,
            'unit' => 'per_person',
            'applies_to' => 'senior',
            'is_optional' => false,
            'sort_order' => 2,
        ]);
        // PWD fee: 20 per PWD → 1 pwd = 20
        PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'PWD',
            'amount' => 20,
            'unit' => 'per_person',
            'applies_to' => 'pwd',
            'is_optional' => false,
            'sort_order' => 3,
        ]);

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03',
            'guests' => 5,
            'adults' => 2,
            'children' => 1,
            'seniors' => 1,
            'pwd' => 1,
        ]);

        $response->assertStatus(201);
        // 60 + 15 + 20 + 20 = 115
        $this->assertEquals(115.0, (float) $response->json('total_price'));
    }

    // ------------------------------------------------------------------
    // Simple-mode backward compatibility
    // ------------------------------------------------------------------

    public function test_simple_mode_booking_ignores_pricing_lines(): void
    {
        $owner = User::factory()->owner()->create();
        $customer = User::factory()->create();
        // Simple campsite, but with stray pricing lines present
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'pricing_mode' => 'simple',
            'capacity' => 10,
            'price_per_night' => 100,
            'price_unit' => 'night',
        ]);
        PricingLine::create([
            'campsite_id' => $campsite->id,
            'label' => 'Should be ignored',
            'amount' => 9999,
            'unit' => 'flat',
            'applies_to' => 'any',
            'is_optional' => false,
            'sort_order' => 0,
        ]);

        $response = $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => '2026-11-01',
            'check_out' => '2026-11-03', // 2 nights
            'guests' => 2,
        ]);

        $response->assertStatus(201);
        // 100 × 2 nights × 2 guests = 400, NOT 400 + 9999
        $this->assertEquals(400.0, (float) $response->json('total_price'));
    }
}