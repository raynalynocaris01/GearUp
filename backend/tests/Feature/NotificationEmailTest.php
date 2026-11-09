<?php

namespace Tests\Feature;

use App\Models\Notification as NotificationModel;
use App\Models\Campsite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_creates_database_notification_for_owner(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'is_approved' => true]);
        $customer = User::factory()->create(['role' => 'customer', 'is_approved' => true]);
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'capacity' => 4,
            'is_available' => true,
            'price_per_night' => 100,
        ]);

        $this->actingAs($customer)->postJson('/api/bookings', [
            'campsite_id' => $campsite->id,
            'check_in' => now()->addDay()->toDateString(),
            'check_out' => now()->addDays(2)->toDateString(),
            'guests' => 1,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
        ]);
    }

    public function test_admin_approval_creates_notification(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_approved' => true]);
        $pending = User::factory()->create(['role' => 'owner', 'is_approved' => false]);

        $this->actingAs($admin)->postJson("/api/admin/users/{$pending->id}/approve");

        $this->assertDatabaseHas('notifications', [
            'user_id' => $pending->id,
        ]);
    }
}