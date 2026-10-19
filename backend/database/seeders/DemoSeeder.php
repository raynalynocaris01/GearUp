<?php

namespace Database\Seeders;

use App\Models\Campsite;
use App\Models\TourGuide;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Admin ──────────────────────────────────────
        User::create([
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
        User::create([
            'name' => 'Rayna Ocaris',
            'email' => 'rayna@example.com',
            'password' => 'password123',
            'role' => 'customer',
            'is_approved' => true,
        ]);

        User::create([
            'name' => 'Cedrix Ravelo',
            'email' => 'cedrix@example.com',
            'password' => 'password123',
            'role' => 'customer',
            'is_approved' => true,
        ]);

        User::create([
            'name' => 'Demo Customer',
            'email' => 'customer@gearup.test',
            'password' => 'password123',
            'role' => 'customer',
            'is_approved' => true,
        ]);

        // ─── Demo Tour Guide ────────────────────────────
        $guideUser = User::create([
            'name' => 'Demo Tour Guide',
            'email' => 'guide@gearup.test',
            'password' => 'password123',
            'role' => 'guide',
            'is_approved' => true,
        ]);

        TourGuide::create([
            'user_id' => $guideUser->id,
            'created_by' => $guideUser->id,
            'campsite_id' => null,
            'name' => $guideUser->name,
            'contact_number' => '09171234567',
            'email' => $guideUser->email,
            'description' => 'Certified mountain guide with 5 years of trekking experience in Negros.',
            'price_per_trip' => 1500.00,
            'is_independent' => true,
            'location' => 'Valencia, Negros Oriental',
        ]);

        // ─── Real Campsites + Gear ──────────────────────
        // Delegates to RealCampsitesSeeder: Grandi Vista (Juan),
        // Kanto Kuridas (Maria), Sheintan Ridge View (Pedro),
        // Sheintan Native Room (Pedro), plus their gear items.
        $this->call(RealCampsitesSeeder::class);

        // ─── Additional campsites with photos ───────────
        // Dons Magna, Ecoco Rocks, Forest Camp, Highland Goat Farm,
        // Inagbatan, Moon Garden, Pigeon Resort, Puncak Tanawan,
        // Vista Panoramica + photos for all 12 campsites.
        $this->call(NewCampsitesSeeder::class);

        // Look up the newly-created campsites so tour guides
        // can be attached to them.
        $grandiVista = Campsite::where('name', 'Grandi Vista Campsites')
            ->firstOrFail();
        $kantoKuridas = Campsite::where('name', 'Kanto Kuridas Camping Ground')
            ->firstOrFail();
        $sheintan = Campsite::where(
            'name',
            'Sheintan Ridge View Camping Ground & Restaurant',
        )->firstOrFail();

        // ─── Tour Guides (attached) ─────────────────────
        TourGuide::create([
            'campsite_id' => $grandiVista->id,
            'created_by' => $owner1->id,
            'name' => 'Raynalyn Ocaris',
            'contact_number' => '0960-877-2220',
            'email' => 'raynalyn@guide.test',
            'description' => 'Certified mountain guide with 5 years of trekking experience in Negros.',
            'price_per_trip' => 1800.00,
            'is_independent' => false,
        ]);

        TourGuide::create([
            'campsite_id' => $kantoKuridas->id,
            'created_by' => $owner2->id,
            'name' => 'Rico Dela Cruz',
            'contact_number' => '0917-123-4567',
            'email' => 'rico@guide.test',
            'description' => 'Local guide specializing in mountain treks and forest trails. 10+ years of experience.',
            'price_per_trip' => 2500.00,
            'is_independent' => false,
        ]);

        TourGuide::create([
            'campsite_id' => $sheintan->id,
            'created_by' => $owner3->id,
            'name' => 'Marco Reyes',
            'contact_number' => '0918-777-1111',
            'email' => 'marco@guide.test',
            'description' => 'Waterfall and ridge tour specialist. Knows every hidden spot in the area.',
            'price_per_trip' => 1500.00,
            'is_independent' => false,
        ]);

        // ─── Tour Guides (independent) ──────────────────
        TourGuide::create([
            'campsite_id' => null,
            'created_by' => $owner1->id,
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
            'created_by' => $owner3->id,
            'name' => 'Ben Aquino',
            'contact_number' => '0917-222-3333',
            'email' => 'ben@guide.test',
            'description' => 'Birdwatching and photography guide. Specializes in forest trails.',
            'price_per_trip' => 3000.00,
            'is_independent' => true,
            'location' => 'Negros Oriental',
        ]);

        // ─── Summary ────────────────────────────────────
        $this->command->info('Demo data seeded.');
        $this->command->info('');
        $this->command->info('Accounts (all use password: password123):');
        $this->command->info('  admin@gearup.test       (admin)');
        $this->command->info('  owner@gearup.test       (approved owner - Grandi Vista)');
        $this->command->info('  maria@gearup.test       (approved owner - Kanto Kuridas)');
        $this->command->info('  pedro@gearup.test       (approved owner - Sheintan Ridge View)');
        $this->command->info('  ana@gearup.test         (pending owner)');
        $this->command->info('  carlo@gearup.test       (pending owner)');
        $this->command->info('  rayna@example.com       (customer)');
        $this->command->info('  cedrix@example.com      (customer)');
        $this->command->info('  customer@gearup.test    (customer)');
        $this->command->info('  guide@gearup.test       (approved tour guide)');
        $this->command->info('');
        $this->command->info('Campsites:');
        $this->command->info('  Grandi Vista Campsites');
        $this->command->info('  Kanto Kuridas Camping Ground');
        $this->command->info('  Sheintan Ridge View Camping Ground & Restaurant');
        $this->command->info('  Sheintan Native Room');
    }
}