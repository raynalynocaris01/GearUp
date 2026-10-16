<?php

namespace Database\Seeders;

use App\Models\Campsite;
use App\Models\GearItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class RealCampsitesSeeder extends Seeder
{
    /**
     * Seeds the three real Philippine campsites used in the GearUp demo.
     * Assigns one owner per campsite (Juan, Maria, Pedro) so each site
     * demonstrates a distinct owner context.
     */
    public function run(): void
    {
        $juan = User::where('email', 'owner@gearup.test')->firstOrFail();
        $maria = User::where('email', 'maria@gearup.test')->firstOrFail();
        $pedro = User::where('email', 'pedro@gearup.test')->firstOrFail();

        // ─── Grandi Vista Campsites (owner: Juan) ─────────────────────────
        $grandiVista = Campsite::create([
            'owner_id' => $juan->id,
            'name' => 'Grandi Vista Campsites',
            'description' => 'A peaceful mountain campsite with panoramic views of the Valencia valley. Entrance fee is PHP 100 per head. Gear available for rent on-site: tents (PHP 350-450), tables (PHP 150-200), and hammocks (PHP 150). Perfect for sunrise watchers and stargazers. Includes basic amenities, fire pits, and clean restrooms.',
            'location' => 'Apolong, Valencia',
            'region' => 'Negros Oriental',
            'price_per_night' => 100.00,
            'price_unit' => 'entrance',
            'image_url' => 'https://picsum.photos/seed/grandivista/600/400',
            'rating' => 0,
            'reviews_count' => 0,
            'capacity' => 20,
            'is_featured' => true,
            'latitude' => 9.28344105,
            'longitude' => 123.21428879,
        ]);

        GearItem::create([
            'owner_id' => $juan->id,
            'name' => 'Camping Tent (Grandi Vista)',
            'description' => 'Weatherproof camping tent, sleeps 2-4. Includes poles, pegs, and rainfly. Rent directly from Grandi Vista Campsites.',
            'category' => 'Tent',
            'price_per_day' => 350.00,
            'image_url' => 'https://picsum.photos/seed/gv-tent/600/400',
            'stock' => 6,
            'is_available' => true,
        ]);

        GearItem::create([
            'owner_id' => $juan->id,
            'name' => 'Camping Table',
            'description' => 'Folding camping table, seats 4. Perfect for outdoor meals and gear organization.',
            'category' => 'Furniture',
            'price_per_day' => 150.00,
            'image_url' => 'https://picsum.photos/seed/gv-table/600/400',
            'stock' => 8,
            'is_available' => true,
        ]);

        GearItem::create([
            'owner_id' => $juan->id,
            'name' => 'Hammock',
            'description' => 'Comfortable single-person hammock with straps. Great for afternoon naps between treks.',
            'category' => 'Furniture',
            'price_per_day' => 150.00,
            'image_url' => 'https://picsum.photos/seed/gv-hammock/600/400',
            'stock' => 10,
            'is_available' => true,
        ]);

        // ─── Kanto Kuridas Camping Ground Café (owner: Maria) ─────────────
        Campsite::create([
            'owner_id' => $maria->id,
            'name' => 'Kanto Kuridas Camping Ground',
            'description' => 'Cozy camping ground with an on-site café. Entrance fee is PHP 35 for a daytime visit or PHP 55 for overnight. The whole campsite can be rented for PHP 1,000 per night - perfect for barkada trips and family gatherings. Come for the food, stay for the cooler mountain air.',
            'location' => 'Valencia, Negros Oriental',
            'region' => 'Negros Oriental',
            'price_per_night' => 55.00,
            'price_unit' => 'entrance',
            'image_url' => 'https://picsum.photos/seed/kanto/600/400',
            'rating' => 0,
            'reviews_count' => 0,
            'capacity' => 15,
            'is_featured' => true,
            'latitude' => 9.28123456,
            'longitude' => 123.24567890,
        ]);

        // ─── Sheintan Ridge View Camping Ground & Restaurant (owner: Pedro) ─
        $sheintan = Campsite::create([
            'owner_id' => $pedro->id,
            'name' => 'Sheintan Ridge View Camping Ground & Restaurant',
            'description' => 'It is a beautiful day up here! Enjoy a cooler environment at Sheintan Ridge View and avoid the heat of the city. We have cold drinks, food, billiards, private karaoke, amazing view rooms, and a lot of camping spaces for you to enjoy. Open 6am-10pm daily for hot meals, hot and cold drinks, and snacks. Visitor fee: PHP 30 per person (children under 13, PWD, and seniors PHP 20). Camping fee: PHP 75 per person. Tent rental: PHP 500 per 2-person tent including beddings, per night. Or bring your own tent for PHP 60 per tent per night. Native rooms available at PHP 800. Rooms with private toilet from PHP 1,000 per night; aircon rooms PHP 2,300-2,500 per night. To book, call 09396277913 or 09953384029.',
            'location' => 'Valencia, Negros Oriental',
            'region' => 'Negros Oriental',
            'price_per_night' => 75.00,
            'price_unit' => 'entrance',
            'image_url' => 'https://picsum.photos/seed/sheintan/600/400',
            'rating' => 0,
            'reviews_count' => 0,
            'capacity' => 30,
            'is_featured' => true,
            'latitude' => 9.30123456,
            'longitude' => 123.25678901,
        ]);

        GearItem::create([
            'owner_id' => $pedro->id,
            'name' => '2-Person Tent (with Beddings)',
            'description' => 'Rent a 2-person tent at Sheintan Ridge View. Includes beddings. Per night rental.',
            'category' => 'Tent',
            'price_per_day' => 500.00,
            'image_url' => 'https://picsum.photos/seed/sheintan-tent/600/400',
            'stock' => 8,
            'is_available' => true,
        ]);

        // ─── Sheintan Native Room (same owner, separate listing) ──────────
        Campsite::create([
            'owner_id' => $pedro->id,
            'name' => 'Sheintan Native Room',
            'description' => 'Native room available at Sheintan Ridge View Camping Ground. Simple and cozy. Book by calling 09396277913 or 09953384029.',
            'location' => 'Valencia, Negros Oriental',
            'region' => 'Negros Oriental',
            'price_per_night' => 800.00,
            'price_unit' => 'night',
            'image_url' => 'https://picsum.photos/seed/sheintan-room/600/400',
            'rating' => 0,
            'reviews_count' => 0,
            'capacity' => 2,
            'is_featured' => false,
            'latitude' => 9.30123456,
            'longitude' => 123.25678901,
        ]);
    }
}