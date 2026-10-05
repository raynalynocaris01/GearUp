<?php

namespace Database\Factories;

use App\Models\Campsite;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Campsite>
 */
class CampsiteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'owner_id' => User::factory()->owner(),
            'name' => 'Campsite ' . fake()->unique()->word(),
            'description' => fake()->sentence(10),
            'location' => fake()->city(),
            'region' => fake()->state(),
            'price_per_night' => 100.00,
            'price_unit' => 'night',
            'image_url' => 'https://example.com/campsite.jpg',
            'rating' => 0,
            'reviews_count' => 0,
            'capacity' => 4,
            'is_featured' => false,
        ];
    }

    public function featured(): static
    {
        return $this->state(fn () => ['is_featured' => true]);
    }

    public function entrance(): static
    {
        return $this->state(fn () => ['price_unit' => 'entrance']);
    }
}