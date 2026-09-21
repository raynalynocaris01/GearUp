<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::updateOrCreate(
            ['email' => 'admin@gearup.test'],
            [
                'name' => 'GearUp Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_approved' => true,
                'is_suspended' => false,
            ]
        );

        // Approved owner
        User::updateOrCreate(
            ['email' => 'owner@gearup.test'],
            [
                'name' => 'Campsite Owner',
                'password' => Hash::make('password123'),
                'role' => 'owner',
                'is_approved' => true,
                'is_suspended' => false,
            ]
        );

        // Pending owner (for admin approval demo)
        User::updateOrCreate(
            ['email' => 'pending@gearup.test'],
            [
                'name' => 'Pending Owner',
                'password' => Hash::make('password123'),
                'role' => 'owner',
                'is_approved' => false,
                'is_suspended' => false,
            ]
        );

        // Demo customer
        User::updateOrCreate(
            ['email' => 'customer@gearup.test'],
            [
                'name' => 'Demo Customer',
                'password' => Hash::make('password123'),
                'role' => 'customer',
                'is_approved' => true,
                'is_suspended' => false,
            ]
        );
    }
}