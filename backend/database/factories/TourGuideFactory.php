<?php

namespace Database\Factories;

use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TourGuide>
 */
class TourGuideFactory extends Factory
{
    protected $model = TourGuide::class;

    public function definition(): array
    {
        $guideUser = User::factory()->create([
            'role' => 'guide',
            'is_approved' => true,
        ]);

        return [
            'user_id' => $guideUser->id,
            'campsite_id' => null,
            'name' => $this->faker->name(),
            'contact_number' => $this->faker->numerify('09#########'),
            'email' => $this->faker->unique()->safeEmail(),
            'description' => 'Experienced local guide.',
            'price_per_trip' => 1500,
            'location' => 'Valencia, Negros Oriental',
            'is_independent' => true,
            'approval_status' => 'approved',
            'meeting_instructions' => null,
            'facebook_url' => null,
            'payment_mode' => 'online',
            'down_payment_percent' => 0,
        ];
    }
}