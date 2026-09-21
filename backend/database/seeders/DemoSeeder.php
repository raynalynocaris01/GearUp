<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\Review;
use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Admin ──────────────────────────────────────
        $admin = User::create([
            'name' => 'GearUp Admin',
            'email' => 'admin@gearup.test',
            'password' => 'password123',
            'role' => 'admin',
            'is_approved' => true,
            'is_suspended' => false,
        ]);

        // ─── Approved Owners ────────────────────────────
        $owner1 = User::create([
            'name' => 'Juan Dela Cruz',
            'email' => 'owner@gearup.test',
            'password' => 'password123',
            'role' => 'owner',
            'is_approved' => true,
        ]);

        $owner2 = User::create([
            'name' => 'Maria Santos',
            'email' => 'maria@gearup.test',
            'password' => 'password123',
            'role' => 'owner',
            'is_approved' => true,
        ]);

        $owner3 = User::create([
            'name' => 'Pedro Reyes',
            'email' => 'pedro@gearup.test',
            'password' => 'password123',
            'role' => 'owner',
            'is_approved' => true,
        ]);

        // ─── Pending Owners ─────────────────────────────
        User::create([
            'name' => 'Ana Lopez',
            'email' => 'ana@gearup.test',
            'password' => 'password123',
            'role' => 'owner',
            'is_approved' => false,
        ]);

        User::create([
            'name' => 'Carlo Mendoza',
            'email' => 'carlo@gearup.test',
            'password' => 'password123',
            'role' => 'owner',
            'is_approved' => false,
        ]);

        // ─── Customers ──────────────────────────────────
        $customer1 = User::create([
            'name' => 'Rayna Ocaris',
            'email' => 'rayna@example.com',
            'password' => 'password123',
            'role' => 'customer',
            'is_approved' => true,
        ]);

        $customer2 = User::create([
            'name' => 'Cedrix Ravelo',
            'email' => 'cedrix@example.com',
            'password' => 'password123',
            'role' => 'customer',
            'is_approved' => true,
        ]);

        $customer3 = User::create([
            'name' => 'Demo Customer',
            'email' => 'customer@gearup.test',
            'password' => 'password123',
            'role' => 'customer',
            'is_approved' => true,
        ]);

        // ─── Campsites ──────────────────────────────────
        $sites = [
            [
                'owner_id' => $owner1->id,
                'name' => 'Grandi Vista Campsite',
                'description' => 'A peaceful mountain campsite with panoramic views of the Valencia valley. Perfect for sunrise watchers and stargazers. Includes basic amenities, fire pits, and clean restrooms.',
                'location' => 'Apolong, Valencia',
                'region' => 'Negros Oriental',
                'price_per_night' => 120.00,
                'price_unit' => 'night',
                'image_url' => 'https://picsum.photos/seed/camp1/600/400',
                'rating' => 4.50,
                'reviews_count' => 0,
                'capacity' => 4,
                'is_featured' => true,
            ],
            [
                'owner_id' => $owner1->id,
                'name' => 'Pulangbato Falls',
                'description' => 'Riverside camping next to a stunning red-rock waterfall. Swim in natural pools, hike nearby trails, and fall asleep to the sound of running water.',
                'location' => 'Valencia, Negros Oriental',
                'region' => 'Negros Oriental',
                'price_per_night' => 200.00,
                'price_unit' => 'entrance',
                'image_url' => 'https://picsum.photos/seed/camp2/600/400',
                'rating' => 4.60,
                'reviews_count' => 0,
                'capacity' => 6,
                'is_featured' => true,
            ],
            [
                'owner_id' => $owner2->id,
                'name' => 'Mt. Talinis Base Camp',
                'description' => 'Base camp for the Mt. Talinis trek. Overnight stay includes tent setup, meals, and a local guide briefing. Ideal for first-time mountain campers.',
                'location' => 'Valencia, Negros Oriental',
                'region' => 'Negros Oriental',
                'price_per_night' => 200.00,
                'price_unit' => 'night',
                'image_url' => 'https://picsum.photos/seed/camp3/600/400',
                'rating' => 4.80,
                'reviews_count' => 0,
                'capacity' => 8,
                'is_featured' => true,
            ],
            [
                'owner_id' => $owner2->id,
                'name' => 'Twin Lakes Retreat',
                'description' => 'A serene campsite between two crater lakes. Kayaking, birdwatching, and quiet evenings by the fire. Great for couples and small families.',
                'location' => 'Sibulan, Negros Oriental',
                'region' => 'Negros Oriental',
                'price_per_night' => 180.00,
                'price_unit' => 'night',
                'image_url' => 'https://picsum.photos/seed/camp4/600/400',
                'rating' => 4.70,
                'reviews_count' => 0,
                'capacity' => 4,
                'is_featured' => true,
            ],
            [
                'owner_id' => $owner3->id,
                'name' => 'Balinsasayao Forest Camp',
                'description' => 'Deep-forest camping inside a protected natural park. Guided night hikes, firefly watching, and dense canopy shade. Book well in advance.',
                'location' => 'Tanjay, Negros Oriental',
                'region' => 'Negros Oriental',
                'price_per_night' => 250.00,
                'price_unit' => 'night',
                'image_url' => 'https://picsum.photos/seed/camp5/600/400',
                'rating' => 4.90,
                'reviews_count' => 0,
                'capacity' => 4,
                'is_featured' => false,
            ],
            [
                'owner_id' => $owner3->id,
                'name' => 'Apo Island Beach Camp',
                'description' => 'Beachfront camping on a marine-protected island. Snorkeling, sea turtles, and sunrise over the Bohol Sea. Boat transfer included.',
                'location' => 'Dauin, Negros Oriental',
                'region' => 'Negros Oriental',
                'price_per_night' => 350.00,
                'price_unit' => 'night',
                'image_url' => 'https://picsum.photos/seed/camp6/600/400',
                'rating' => 4.80,
                'reviews_count' => 0,
                'capacity' => 6,
                'is_featured' => true,
            ],
        ];

        foreach ($sites as $data) {
            Campsite::create($data);
        }

        $grandiVista = Campsite::where('name', 'Grandi Vista Campsite')->first();
        $pulangbato = Campsite::where('name', 'Pulangbato Falls')->first();
        $talinis = Campsite::where('name', 'Mt. Talinis Base Camp')->first();

        // ─── Tour Guides (attached) ─────────────────────
        TourGuide::create([
            'campsite_id' => $grandiVista->id,
            'name' => 'Raynalyn Ocaris',
            'contact_number' => '0960-877-2220',
            'email' => 'raynalyn@guide.test',
            'description' => 'Certified mountain guide with 5 years of trekking experience in Negros.',
            'price_per_trip' => 1800.00,
            'is_independent' => false,
        ]);

        TourGuide::create([
            'campsite_id' => $talinis->id,
            'name' => 'Juan Dela Cruz',
            'contact_number' => '0917-123-4567',
            'email' => 'juan@guide.test',
            'description' => 'Local guide specializing in Mt. Talinis treks. 10+ years of experience.',
            'price_per_trip' => 2500.00,
            'is_independent' => false,
        ]);

        TourGuide::create([
            'campsite_id' => $pulangbato->id,
            'name' => 'Marco Reyes',
            'contact_number' => '0918-777-1111',
            'email' => 'marco@guide.test',
            'description' => 'Waterfall tour specialist. Knows every hidden pool in the area.',
            'price_per_trip' => 1500.00,
            'is_independent' => false,
        ]);

        // ─── Tour Guides (independent) ──────────────────
        TourGuide::create([
            'campsite_id' => null,
            'name' => 'Isabel Torres',
            'contact_number' => '0917-555-8888',
            'email' => 'isabel@guide.test',
            'description' => 'Freelance mountain and forest guide. Available for custom day trips.',
            'price_per_trip' => 2500.00,
            'is_independent' => true,
            'location' => 'Negros Oriental',
        ]);

        TourGuide::create([
            'campsite_id' => null,
            'name' => 'Ben Aquino',
            'contact_number' => '0917-222-3333',
            'email' => 'ben@guide.test',
            'description' => 'Birdwatching and photography guide. Specializes in forest trails.',
            'price_per_trip' => 3000.00,
            'is_independent' => true,
            'location' => 'Negros Oriental',
        ]);

        // ─── Bookings (varied states) ───────────────────
        $ray = TourGuide::where('name', 'Raynalyn Ocaris')->first();
        $juan = TourGuide::where('name', 'Juan Dela Cruz')->first();
        $isabel = TourGuide::where('name', 'Isabel Torres')->first();

        // Completed booking with a review
        $b1 = Booking::create([
            'user_id' => $customer1->id,
            'campsite_id' => $grandiVista->id,
            'tour_guide_id' => $ray->id,
            'check_in' => now()->subDays(20)->toDateString(),
            'check_out' => now()->subDays(18)->toDateString(),
            'guests' => 2,
            'total_price' => 2280.00,
            'status' => 'completed',
        ]);

        Review::create([
            'user_id' => $customer1->id,
            'campsite_id' => $grandiVista->id,
            'booking_id' => $b1->id,
            'rating' => 5,
            'comment' => 'Raynalyn was an amazing guide! The sunrise view from the campsite is unforgettable.',
        ]);

        // Another completed booking with a review
        $b2 = Booking::create([
            'user_id' => $customer2->id,
            'campsite_id' => $talinis->id,
            'tour_guide_id' => $juan->id,
            'check_in' => now()->subDays(15)->toDateString(),
            'check_out' => now()->subDays(13)->toDateString(),
            'guests' => 3,
            'total_price' => 3700.00,
            'status' => 'completed',
        ]);

        Review::create([
            'user_id' => $customer2->id,
            'campsite_id' => $talinis->id,
            'booking_id' => $b2->id,
            'rating' => 5,
            'comment' => 'Excellent trek. Juan knows the mountain like the back of his hand.',
        ]);

        // Confirmed upcoming booking
        Booking::create([
            'user_id' => $customer1->id,
            'campsite_id' => $talinis->id,
            'tour_guide_id' => null,
            'check_in' => now()->addDays(10)->toDateString(),
            'check_out' => now()->addDays(12)->toDateString(),
            'guests' => 2,
            'total_price' => 800.00,
            'status' => 'confirmed',
        ]);

        // Pending booking
        Booking::create([
            'user_id' => $customer3->id,
            'campsite_id' => $pulangbato->id,
            'tour_guide_id' => null,
            'check_in' => now()->addDays(5)->toDateString(),
            'check_out' => now()->addDays(6)->toDateString(),
            'guests' => 1,
            'total_price' => 200.00,
            'status' => 'pending',
        ]);

        // Guide-only booking
        Booking::create([
            'user_id' => $customer1->id,
            'campsite_id' => null,
            'tour_guide_id' => $isabel->id,
            'guests' => 2,
            'total_price' => 2500.00,
            'status' => 'pending',
        ]);

        // Cancelled booking
        Booking::create([
            'user_id' => $customer3->id,
            'campsite_id' => $grandiVista->id,
            'tour_guide_id' => null,
            'check_in' => now()->subDays(5)->toDateString(),
            'check_out' => now()->subDays(3)->toDateString(),
            'guests' => 4,
            'total_price' => 720.00,
            'status' => 'cancelled',
        ]);

        // Recalculate ratings for campsites with reviews
        foreach (Campsite::all() as $site) {
            $stats = Review::where('campsite_id', $site->id)
                ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
                ->first();

            if ($stats->total > 0) {
                $site->update([
                    'rating' => round((float) $stats->avg_rating, 2),
                    'reviews_count' => (int) $stats->total,
                ]);
            }
        }

        $this->command->info('Demo data seeded.');
        $this->command->info('');
        $this->command->info('Accounts (all use password: password123):');
        $this->command->info('  admin@gearup.test       (admin)');
        $this->command->info('  owner@gearup.test       (approved owner)');
        $this->command->info('  maria@gearup.test       (approved owner)');
        $this->command->info('  pedro@gearup.test       (approved owner)');
        $this->command->info('  ana@gearup.test         (pending owner)');
        $this->command->info('  carlo@gearup.test       (pending owner)');
        $this->command->info('  rayna@example.com       (customer)');
        $this->command->info('  cedrix@example.com      (customer)');
        $this->command->info('  customer@gearup.test    (customer)');
    }
}