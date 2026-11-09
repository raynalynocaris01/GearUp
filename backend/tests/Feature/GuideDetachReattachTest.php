<?php

namespace Tests\Feature;

use App\Models\Campsite;
use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuideDetachReattachTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_detach_and_reattach_guide(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'is_approved' => true]);
        $guideUser = User::factory()->create([
            'role' => 'guide',
            'is_approved' => true,
            'password_must_change' => false,
        ]);
        $campsite = Campsite::factory()->create(['owner_id' => $owner->id]);
        $guide = TourGuide::factory()->create([
            'campsite_id' => $campsite->id,
            'is_independent' => false,
            'user_id' => $guideUser->id,
            'approval_status' => 'approved',
            'created_by' => $owner->id,
        ]);

        // Detach
        $detachResponse = $this->actingAs($owner)
            ->deleteJson("/api/owner/tour-guides/{$guide->id}");
        $detachResponse->assertOk();

        $guide->refresh();
        $this->assertNull($guide->campsite_id);
        $this->assertTrue((bool) $guide->is_independent);

        // Re-attach
        $attachResponse = $this->actingAs($owner)
            ->postJson("/api/owner/campsites/{$campsite->id}/attach-guide", [
                'guide_id' => $guide->id,
            ]);
        $attachResponse->assertOk();

        $guide->refresh();
        $this->assertEquals($campsite->id, $guide->campsite_id);
        $this->assertFalse((bool) $guide->is_independent);
    }
}