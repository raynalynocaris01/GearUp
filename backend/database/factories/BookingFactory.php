<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    public function definition(): array
    {
        $checkIn = fake()->dateTimeBetween('+1 day', '+10 days');
        $checkOut = (clone $checkIn)->modify('+2 days');

        return [
            'user_id' => User::factory(),
            'campsite_id' => Campsite::factory(),
            'check_in' => $checkIn->format('Y-m-d'),
            'check_out' => $checkOut->format('Y-m-d'),
            'guests' => 2,
            'total_price' => 200.00,
            'status' => 'pending',
            'notes' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn () => ['status' => 'confirmed']);
    }

    public function completed(): static
    {
        return $this->state(fn () => ['status' => 'completed']);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => 'cancelled']);
    }
}