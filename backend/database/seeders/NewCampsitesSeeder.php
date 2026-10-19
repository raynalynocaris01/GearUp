<?php

namespace Database\Seeders;

use App\Models\Campsite;
use App\Models\CampsitePhoto;
use App\Models\User;
use Illuminate\Database\Seeder;

class NewCampsitesSeeder extends Seeder
{
    public function run(): void
    {
        // ─── New owner accounts (one per campsite) ────────────────
        $owners = [];
        $ownerConfigs = [
            'dons-magna'        => ['name' => 'Dons Magna Owner'],
            'ecoco-rocks'       => ['name' => 'Ecoco Rocks Owner'],
            'forest-camp'       => ['name' => 'Forest Camp Owner'],
            'highland-goat'     => ['name' => 'Highland Goat Farm Owner'],
            'inagbatan'         => ['name' => 'Inagbatan Campsite Owner'],
            'moon-garden'       => ['name' => 'Moon Garden Owner'],
            'pigeon-resort'     => ['name' => 'Pigeon Resort Owner'],
            'puncak-tanawan'    => ['name' => 'Puncak Tanawan Owner'],
            'vista-panoramica'  => ['name' => 'Vista Panoramica Owner'],
        ];

        foreach ($ownerConfigs as $slug => $config) {
            $owners[$slug] = User::updateOrCreate(
                ['email' => "{$slug}-owner@gearup.test"],
                [
                    'name'         => $config['name'],
                    'password'     => 'password123',
                    'role'         => 'owner',
                    'is_approved'  => true,
                    'is_suspended' => false,
                ]
            );
        }

        // ─── New campsites ─────────────────────────────────────────
        // Each: [name, location, description, capacity, photos_count]
        $campsites = [
            'dons-magna' => [
                'name' => 'Dons Magna',
                'location' => 'Negros Oriental',
                'description' => 'A serene campsite surrounded by nature. Perfect for families and barkada getaways. Enjoy fresh air, mountain views, and basic amenities.',
                'capacity' => 20,
                'photos' => 3,
            ],
            'ecoco-rocks' => [
                'name' => 'Ecoco Rocks',
                'location' => 'Negros Oriental',
                'description' => 'Eco-friendly campsite nestled among rock formations. A unique outdoor experience with stunning natural surroundings.',
                'capacity' => 15,
                'photos' => 4,
            ],
            'forest-camp' => [
                'name' => 'Forest Camp',
                'location' => 'Negros Oriental',
                'description' => 'Camp under the trees in a lush forest setting. Peaceful environment with cool shade and fresh air.',
                'capacity' => 25,
                'photos' => 8,
            ],
            'highland-goat' => [
                'name' => 'Highland Goat Farm Mountain Resort',
                'location' => 'Maningcao, Sibulan, Negros Oriental',
                'description' => 'Camping paradise in Sibulan with swimming pool, bonfire, goat farm, clean CR/shower rooms, FREE games & entertainment, and stunning overlooking mountain views. Perfect for barkada, families, and group getaways. Fresh mountain air and peaceful surroundings.',
                'capacity' => 30,
                'photos' => 7,
            ],
            'inagbatan' => [
                'name' => 'Inagbatan Campsite',
                'location' => 'Brgy. Malaunay, Valencia, Negros Oriental',
                'description' => 'Escape to the peaceful highlands of Inagbatan Camping Site in Brgy. Malaunay, Valencia. Cool mountain air, scenic views, and the beauty of nature await. Whether camping under the stars or seeking a quiet retreat, Inagbatan is the perfect place to unwind.',
                'capacity' => 20,
                'photos' => 6,
            ],
            'moon-garden' => [
                'name' => 'Moon Garden',
                'location' => 'Negros Oriental',
                'description' => 'A magical campsite named for its stunning night views. Ideal for stargazing and peaceful overnight stays.',
                'capacity' => 15,
                'photos' => 5,
            ],
            'pigeon-resort' => [
                'name' => 'Pigeon Resort',
                'location' => 'Negros Oriental',
                'description' => 'Relaxing resort-style camping with comfortable facilities and beautiful scenery.',
                'capacity' => 20,
                'photos' => 3,
            ],
            'puncak-tanawan' => [
                'name' => 'Puncak Tanawan',
                'location' => 'Negros Oriental',
                'description' => 'A hillside campsite with panoramic views. Cool climate, scenic sunrises, and a peaceful atmosphere.',
                'capacity' => 15,
                'photos' => 4,
            ],
            'vista-panoramica' => [
                'name' => 'Vista Panoramica',
                'location' => 'Negros Oriental',
                'description' => 'Enjoy breathtaking panoramic vistas from this beautiful campsite. Ideal for nature lovers and photographers.',
                'capacity' => 20,
                'photos' => 6,
            ],
        ];

        foreach ($campsites as $slug => $config) {
            $campsite = Campsite::updateOrCreate(
                ['name' => $config['name']],
                [
                    'owner_id'        => $owners[$slug]->id,
                    'description'     => $config['description'],
                    'location'        => $config['location'],
                    'region'          => 'Negros Oriental',
                    'price_per_night' => 100.00,
                    'price_unit'      => 'entrance',
                    'image_url'       => "/storage/campsites/{$slug}-1.jpg",
                    'rating'          => 0,
                    'reviews_count'   => 0,
                    'capacity'        => $config['capacity'],
                    'is_featured'     => false,
                    'is_available'    => true,
                    'pricing_mode'    => 'simple',
                ]
            );

            for ($n = 1; $n <= $config['photos']; $n++) {
                CampsitePhoto::updateOrCreate(
                    [
                        'campsite_id' => $campsite->id,
                        'image_url'   => "/storage/campsites/{$slug}-{$n}.jpg",
                    ],
                    ['sort_order' => $n - 1]
                );
            }
        }

        // ─── Photos for EXISTING campsites (Grandi Vista, Kanto, Sheintan) ─
        $existing = [
            'Grandi Vista Campsites'                          => ['slug' => 'grandi-vista',      'count' => 5],
            'Kanto Kuridas Camping Ground'                    => ['slug' => 'kanto-kuridas',     'count' => 6],
            'Sheintan Ridge View Camping Ground & Restaurant' => ['slug' => 'shientan',          'count' => 6],
        ];

        foreach ($existing as $name => $config) {
            $campsite = Campsite::where('name', $name)->first();
            if (! $campsite) continue;

            for ($n = 1; $n <= $config['count']; $n++) {
                CampsitePhoto::updateOrCreate(
                    [
                        'campsite_id' => $campsite->id,
                        'image_url'   => "/storage/campsites/{$config['slug']}-{$n}.jpg",
                    ],
                    ['sort_order' => $n - 1]
                );
            }
        }

        // ─── Sheintan Native Room: hero image only, no gallery ─────
        Campsite::where('name', 'Sheintan Native Room')->update([
            'image_url' => '/storage/campsites/shientan-1.jpg',
        ]);
    }
}