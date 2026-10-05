<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('+1 day', '+30 days');
        $end = (clone $start)->modify('+3 hours');

        return [
            'owner_id' => User::factory()->owner(),
            'name' => 'Event ' . fake()->unique()->word(),
            'description' => fake()->sentence(12),
            'location' => fake()->city(),
            'region' => fake()->state(),
            'starts_at' => $start,
            'ends_at' => $end,
            'price_per_person' => 250.00,
            'capacity' => 10,
            'image_url' => 'https://example.com/event.jpg',
            'is_published' => true,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['is_published' => false]);
    }
}