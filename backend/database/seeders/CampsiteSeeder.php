<?php

namespace Database\Seeders;

use App\Models\Campsite;
use Illuminate\Database\Seeder;

class CampsiteSeeder extends Seeder
{
    public function run(): void
    {
        $campsites = [
            [
                'name' => 'Grandi Vista Campsite',
                'description' => 'A peaceful mountain campsite with panoramic views of the Valencia valley. Perfect for sunrise watchers and stargazers. Includes basic amenities, fire pits, and clean restrooms.',
                'location' => 'Apolong, Valencia',
                'region' => 'Negros Oriental',
                'price_per_night' => 120.00,
                'price_unit' => 'night',
                'image_url' => 'https://picsum.photos/seed/camp1/600/400',
                'rating' => 4.50,
                'reviews_count' => 128,
                'capacity' => 4,
                'is_featured' => true,
            ],
            [
                'name' => 'Pulangbato Falls',
                'description' => 'Riverside camping next to a stunning red-rock waterfall. Swim in natural pools, hike nearby trails, and fall asleep to the sound of running water.',
                'location' => 'Valencia, Negros Oriental',
                'region' => 'Negros Oriental',
                'price_per_night' => 200.00,
                'price_unit' => 'entrance',
                'image_url' => 'https://picsum.photos/seed/camp2/600/400',
                'rating' => 4.60,
                'reviews_count' => 194,
                'capacity' => 6,
                'is_featured' => true,
            ],
            [
                'name' => 'Mt. Talinis Base Camp',
                'description' => 'Base camp for the Mt. Talinis trek. Overnight stay includes tent setup, meals, and a local guide briefing. Ideal for first-time mountain campers.',
                'location' => 'Valencia, Negros Oriental',
                'region' => 'Negros Oriental',
                'price_per_night' => 200.00,
                'price_unit' => 'night',
                'image_url' => 'https://picsum.photos/seed/camp3/600/400',
                'rating' => 4.80,
                'reviews_count' => 250,
                'capacity' => 8,
                'is_featured' => true,
            ],
            [
                'name' => 'Twin Lakes Retreat',
                'description' => 'A serene campsite between two crater lakes. Kayaking, birdwatching, and quiet evenings by the fire. Great for couples and small families.',
                'location' => 'Sibulan, Negros Oriental',
                'region' => 'Negros Oriental',
                'price_per_night' => 180.00,
                'price_unit' => 'night',
                'image_url' => 'https://picsum.photos/seed/camp4/600/400',
                'rating' => 4.70,
                'reviews_count' => 162,
                'capacity' => 4,
                'is_featured' => true,
            ],
            [
                'name' => 'Balinsasayao Forest Camp',
                'description' => 'Deep-forest camping inside a protected natural park. Guided night hikes, firefly watching, and dense canopy shade. Book well in advance.',
                'location' => 'Tanjay, Negros Oriental',
                'region' => 'Negros Oriental',
                'price_per_night' => 250.00,
                'price_unit' => 'night',
                'image_url' => 'https://picsum.photos/seed/camp5/600/400',
                'rating' => 4.90,
                'reviews_count' => 87,
                'capacity' => 4,
                'is_featured' => false,
            ],
            [
                'name' => 'Apo Island Beach Camp',
                'description' => 'Beachfront camping on a marine-protected island. Snorkeling, sea turtles, and sunrise over the Bohol Sea. Boat transfer included.',
                'location' => 'Dauin, Negros Oriental',
                'region' => 'Negros Oriental',
                'price_per_night' => 350.00,
                'price_unit' => 'night',
                'image_url' => 'https://picsum.photos/seed/camp6/600/400',
                'rating' => 4.80,
                'reviews_count' => 142,
                'capacity' => 6,
                'is_featured' => true,
            ],
        ];

        foreach ($campsites as $campsite) {
            Campsite::create($campsite);
        }
    }
}