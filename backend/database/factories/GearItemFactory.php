<?php

namespace Database\Factories;

use App\Models\GearItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GearItem>
 */
class GearItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'name' => 'Gear ' . fake()->unique()->word(),
            'description' => fake()->sentence(8),
            'category' => fake()->randomElement(['Tent', 'Backpack', 'Sleeping Bag']),
            'price_per_day' => 50.00,
            'image_url' => 'https://example.com/gear.jpg',
            'stock' => 3,
            'is_available' => true,
        ];
    }

    public function unavailable(): static
    {
        return $this->state(fn () => ['is_available' => false]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn () => ['stock' => 0]);
    }
}