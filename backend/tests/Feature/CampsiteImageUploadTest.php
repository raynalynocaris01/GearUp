<?php

namespace Tests\Feature;

use App\Models\Campsite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CampsiteImageUploadTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The owner can upload a valid image for their campsite.
     */
    public function test_owner_can_upload_campsite_image(): void
    {
        Storage::fake('public');

        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
            'image_url' => 'https://example.com/original.jpg',
        ]);

        $file = UploadedFile::fake()->image('campsite.jpg', 800, 600);

        $response = $this->actingAs($owner)->postJson(
            "/api/owner/campsites/{$campsite->id}/image",
            ['image' => $file],
        );

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Image uploaded.');

        // The campsite's image_url was updated
        $campsite->refresh();
        $this->assertNotEquals(
            'https://example.com/original.jpg',
            $campsite->image_url,
        );
        $this->assertStringContainsString('campsites/', $campsite->image_url);

        // A file landed in storage
        $files = Storage::disk('public')->files('campsites');
        $this->assertCount(1, $files);
    }

    /**
     * A non-owner cannot upload an image for someone else's campsite.
     */
    public function test_non_owner_cannot_upload_campsite_image(): void
    {
        Storage::fake('public');

        $owner = User::factory()->owner()->create();
        $otherOwner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
        ]);

        $file = UploadedFile::fake()->image('campsite.jpg');

        $response = $this->actingAs($otherOwner)->postJson(
            "/api/owner/campsites/{$campsite->id}/image",
            ['image' => $file],
        );

        $response->assertStatus(403);

        // No file was stored
        $this->assertCount(0, Storage::disk('public')->files('campsites'));
    }

    /**
     * Uploading a non-image file is rejected.
     */
    public function test_uploading_non_image_is_rejected(): void
    {
        Storage::fake('public');

        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
        ]);

        $file = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->actingAs($owner)->postJson(
            "/api/owner/campsites/{$campsite->id}/image",
            ['image' => $file],
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);

        $this->assertCount(0, Storage::disk('public')->files('campsites'));
    }

    /**
     * Uploading an image larger than 2 MB is rejected.
     */
    public function test_uploading_too_large_image_is_rejected(): void
    {
        Storage::fake('public');

        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
        ]);

        // 3000 KB > 2 MB limit
        $file = UploadedFile::fake()->image('huge.jpg')->size(3000);

        $response = $this->actingAs($owner)->postJson(
            "/api/owner/campsites/{$campsite->id}/image",
            ['image' => $file],
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    }

    /**
     * Missing file is rejected.
     */
    public function test_missing_file_is_rejected(): void
    {
        Storage::fake('public');

        $owner = User::factory()->owner()->create();
        $campsite = Campsite::factory()->create([
            'owner_id' => $owner->id,
        ]);

        $response = $this->actingAs($owner)->postJson(
            "/api/owner/campsites/{$campsite->id}/image",
            [],
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
    }
}