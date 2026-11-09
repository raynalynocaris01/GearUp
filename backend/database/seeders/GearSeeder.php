<?php

namespace Database\Seeders;

use App\Models\GearItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class GearSeeder extends Seeder
{
    public function run(): void
    {
        // Fetch all the different campsite owners
        $juan = User::where('email', 'owner@gearup.test')->first(); // Grandi Vista
        $maria = User::where('email', 'maria@gearup.test')->first(); // Maria's Campsite
        $pedro = User::where('email', 'pedro@gearup.test')->first(); // Pedro's Campsite
        
        // Fetch the individual
        $rayna = User::where('email', 'rayna@example.com')->first();

        if (!$juan || !$maria || !$pedro || !$rayna) {
            $this->command->error('Users not found. Please run DatabaseSeeder first.');
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // CAMPSITE PROVIDED GEAR (Split among Owners)
        // ═══════════════════════════════════════════════════════════════

        // --- Juan Dela Cruz (Grandi Vista) ---
        $juanGear = [
            ['name' => 'Camping Tent', 'category' => 'Tent', 'price_per_day' => 350.00, 'stock' => 5, 'description' => 'Big-sized waterproof camping tent, sleeps 2-4.', 'image_url' => '/images/gear/gear-03.jpg'],
            ['name' => 'Camping Table', 'category' => 'Furniture', 'price_per_day' => 150.00, 'stock' => 8, 'description' => 'Folding camping table, seats 4.', 'image_url' => '/images/gear/gear-07.jpg'],
            ['name' => 'Hammock', 'category' => 'Furniture', 'price_per_day' => 150.00, 'stock' => 10, 'description' => 'Comfortable 2-person hammock with straps.', 'image_url' => '/images/gear/gear-21.jpg'],
            ['name' => 'Extension Wire', 'category' => 'Power', 'price_per_day' => 0.00, 'stock' => 6, 'description' => '100ft heavy-duty cord reel.', 'image_url' => '/images/gear/gear-02.jpg'],
            ['name' => 'Vintage Lantern', 'category' => 'Power', 'price_per_day' => 120.00, 'stock' => 8, 'description' => 'Battery-powered stepless dimming LED lantern.', 'image_url' => '/images/gear/gear-10.jpg'],
        ];

        // --- Maria Santos ---
        $mariaGear = [
            ['name' => 'Double Gas Stove', 'category' => 'Cooking', 'price_per_day' => 250.00, 'stock' => 4, 'description' => 'Naturehike dual-burner camping stove with carry bag.', 'image_url' => '/images/gear/gear-26.jpg'],
            ['name' => 'Campfire Grate', 'category' => 'Cooking', 'price_per_day' => 50.00, 'stock' => 10, 'description' => 'Foldable non-stick grill grate for campfires.', 'image_url' => '/images/gear/gear-12.jpg'],
            ['name' => 'Cookware Set', 'category' => 'Cooking', 'price_per_day' => 100.00, 'stock' => 6, 'description' => 'Portable stainless steel cookware set.', 'image_url' => '/images/gear/gear-29.jpg'],
            ['name' => 'Stainless Mug', 'category' => 'Cooking', 'price_per_day' => 20.00, 'stock' => 20, 'description' => 'Stainless camping mug with carabiner handle.', 'image_url' => '/images/gear/gear-39.jpg'],
            ['name' => 'Water Bottle', 'category' => 'Cooking', 'price_per_day' => 30.00, 'stock' => 15, 'description' => 'Half-gallon insulated water jug with handle.', 'image_url' => '/images/gear/gear-08.jpg'],
        ];

        // --- Pedro Reyes ---
        $pedroGear = [
            ['name' => 'Camping Cot', 'category' => 'Furniture', 'price_per_day' => 250.00, 'stock' => 3, 'description' => 'Heavy-duty 1200D Oxford folding cot.', 'image_url' => '/images/gear/gear-06.jpg'],
            ['name' => 'Dome Tent (Large)', 'category' => 'Tent', 'price_per_day' => 500.00, 'stock' => 4, 'description' => '4-in-1 elevated tent camping bed combo with air mattress.', 'image_url' => '/images/gear/gear-03.jpg'],
            ['name' => 'Inflatable Sleeping Pad', 'category' => 'Furniture', 'price_per_day' => 60.00, 'stock' => 20, 'description' => 'Comfortable self-inflating camping mat.', 'image_url' => '/images/gear/gear-32.jpg'],
            ['name' => 'Sleeping Bag', 'category' => 'Furniture', 'price_per_day' => 80.00, 'stock' => 12, 'description' => 'Warm insulated mummy-style sleeping bag.', 'image_url' => '/images/gear/gear-40.jpg'],
            ['name' => 'Reflective Sunglasses', 'category' => 'Apparel', 'price_per_day' => 25.00, 'stock' => 20, 'description' => 'Wrap-around mirrored glasses for outdoor activities.', 'image_url' => '/images/gear/gear-04.jpg'],
        ];

 

         // Add Ana's old gear to Pedro so it doesn't go to waste
        $pedroGear = array_merge($pedroGear, [
            ['name' => 'Cooler Box', 'category' => 'Cooling', 'price_per_day' => 180.00, 'stock' => 5, 'description' => '17L hard-type cooler box.', 'image_url' => '/images/gear/gear-38.jpg'],
            ['name' => 'First Aid Kit', 'category' => 'Safety', 'price_per_day' => 50.00, 'stock' => 10, 'description' => 'Red emergency first aid kit with essential supplies.', 'image_url' => '/images/gear/gear-19.jpg'],
            ['name' => 'Microfiber Towel', 'category' => 'Hygiene', 'price_per_day' => 25.00, 'stock' => 15, 'description' => 'Quick-dry microfiber cloth (pack of 4).', 'image_url' => '/images/gear/gear-31.jpg'],
            ['name' => 'Washbasin', 'category' => 'Hygiene', 'price_per_day' => 15.00, 'stock' => 20, 'description' => 'Portable laundry and foot-soaking basin.', 'image_url' => '/images/gear/gear-37.jpg'],
        ]);

        foreach ($juanGear as $item) GearItem::create(array_merge($item, ['owner_id' => $juan->id]));
        foreach ($mariaGear as $item) GearItem::create(array_merge($item, ['owner_id' => $maria->id]));
        foreach ($pedroGear as $item) GearItem::create(array_merge($item, ['owner_id' => $pedro->id]));


        // ═══════════════════════════════════════════════════════════════
        // INDIVIDUAL GEAR (Owner: Rayna Ocaris)
        // ═══════════════════════════════════════════════════════════════
        $individualGear = [
            ['name' => 'Camp Shower', 'category' => 'Hygiene', 'price_per_day' => 100.00, 'stock' => 5, 'description' => '5-gallon (20L) solar-heated portable camp shower.', 'image_url' => '/images/gear/gear-05.jpg'],
            ['name' => 'Waterproof Matches', 'category' => 'Fire', 'price_per_day' => 10.00, 'stock' => 40, 'description' => 'Titan stormproof match kit with waterproof case.', 'image_url' => '/images/gear/gear-09.jpg'],
            ['name' => 'Hiking Backpack', 'category' => 'Apparel', 'price_per_day' => 200.00, 'stock' => 8, 'description' => 'TETON Scout internal frame backpack with rain cover.', 'image_url' => '/images/gear/gear-11.jpg'],
            ['name' => 'Beach Tent', 'category' => 'Tent', 'price_per_day' => 300.00, 'stock' => 3, 'description' => 'Dovetail-shaped vinyl canopy tent, weather-resistant.', 'image_url' => '/images/gear/gear-13.jpg'],
            ['name' => 'Waterproof Phone Case', 'category' => 'Hygiene', 'price_per_day' => 15.00, 'stock' => 50, 'description' => 'Universal waterproof pouch for phones.', 'image_url' => '/images/gear/gear-18.jpg'],
            ['name' => 'Lighter', 'category' => 'Fire', 'price_per_day' => 10.00, 'stock' => 30, 'description' => 'Windproof flip-top lighter.', 'image_url' => '/images/gear/gear-20.jpg'],
            ['name' => 'Headlamp', 'category' => 'Power', 'price_per_day' => 25.00, 'stock' => 30, 'description' => 'LED headlamp with motion sensor.', 'image_url' => '/images/gear/gear-22.jpg'],
            ['name' => 'Rain Poncho', 'category' => 'Apparel', 'price_per_day' => 30.00, 'stock' => 25, 'description' => 'Waterproof hooded rain poncho with pouch.', 'image_url' => '/images/gear/gear-23.jpg'],
            ['name' => 'Hiking Boots', 'category' => 'Apparel', 'price_per_day' => 150.00, 'stock' => 5, 'description' => 'Waterproof outdoor trekking boots.', 'image_url' => '/images/gear/gear-24.jpg'],
            ['name' => 'Monocular Telescope', 'category' => 'Navigation', 'price_per_day' => 80.00, 'stock' => 5, 'description' => '16x52 HD monocular for wildlife viewing.', 'image_url' => '/images/gear/gear-25.jpg'],
            ['name' => 'Insect Repellent', 'category' => 'Hygiene', 'price_per_day' => 5.00, 'stock' => 50, 'description' => 'All-natural DEET-free insect repellent spray.', 'image_url' => '/images/gear/gear-27.jpg'],
            ['name' => 'Sewing Kit', 'category' => 'Tools', 'price_per_day' => 30.00, 'stock' => 2, 'description' => 'Portable sewing kit with 100+ spools.', 'image_url' => '/images/gear/gear-28.jpg'],
            ['name' => 'Ice Pack', 'category' => 'Cooling', 'price_per_day' => 15.00, 'stock' => 30, 'description' => 'Rapid performance reusable ice pack.', 'image_url' => '/images/gear/gear-30.jpg'],
            ['name' => 'Solar Power Bank', 'category' => 'Power', 'price_per_day' => 60.00, 'stock' => 15, 'description' => '20000mAh solar charger with wireless charging.', 'image_url' => '/images/gear/gear-33.jpg'],
            ['name' => 'Hiking Apparel Set', 'category' => 'Apparel', 'price_per_day' => 80.00, 'stock' => 10, 'description' => 'Best hiking clothes, shoes, and gear for summer.', 'image_url' => '/images/gear/gear-34.jpg'],
            ['name' => 'Multitool', 'category' => 'Tools', 'price_per_day' => 35.00, 'stock' => 15, 'description' => 'Swiss Army multi-tool pocket knife.', 'image_url' => '/images/gear/gear-36.jpg'],
            ['name' => 'Inflatable Pillow', 'category' => 'Comfort', 'price_per_day' => 20.00, 'stock' => 20, 'description' => 'Lightweight inflatable camping pillow.', 'image_url' => '/images/gear/gear-41.jpg'],
            ['name' => 'Gear Bundle', 'category' => 'Tools', 'price_per_day' => 100.00, 'stock' => 3, 'description' => '10 cool pieces of gear for your next camping trip.', 'image_url' => '/images/gear/gear-01.jpg'],
            ['name' => 'Utility Kit', 'category' => 'Tools', 'price_per_day' => 50.00, 'stock' => 5, 'description' => 'General utility kit for outdoor setups.', 'image_url' => '/images/gear/gear-14.jpg'],
            ['name' => 'Camping Pack', 'category' => 'Apparel', 'price_per_day' => 150.00, 'stock' => 8, 'description' => 'Durable outdoor gear pack.', 'image_url' => '/images/gear/gear-15.jpg'],
            ['name' => 'Trail Set', 'category' => 'Tools', 'price_per_day' => 100.00, 'stock' => 10, 'description' => 'Lightweight trail gear.', 'image_url' => '/images/gear/gear-16.jpg'],
            ['name' => 'Outdoor Kit', 'category' => 'Tools', 'price_per_day' => 75.00, 'stock' => 6, 'description' => 'All-around outdoor kit.', 'image_url' => '/images/gear/gear-17.jpg'],
            ['name' => 'Fishing Rod', 'category' => 'Tools', 'price_per_day' => 120.00, 'stock' => 5, 'description' => 'Collapsible fishing rod.', 'image_url' => '/images/gear/gear-35.jpg'],
        ];

        foreach ($individualGear as $item) {
            GearItem::create(array_merge($item, ['owner_id' => $rayna->id]));
        }
    }
}