<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gear_items', function (Blueprint $table) {
            // 'meetup' | 'pickup' | 'deliver' | 'all'
            $table->string('pickup_method', 20)->default('meetup')->after('is_available');
            $table->text('pickup_address')->nullable()->after('pickup_method');
            $table->string('pickup_landmark', 255)->nullable()->after('pickup_address');
            $table->string('pickup_hours', 255)->nullable()->after('pickup_landmark');
            $table->text('pickup_instructions')->nullable()->after('pickup_hours');
            $table->string('contact_number', 30)->nullable()->after('pickup_instructions');
        });
    }

    public function down(): void
    {
        Schema::table('gear_items', function (Blueprint $table) {
            $table->dropColumn([
                'pickup_method',
                'pickup_address',
                'pickup_landmark',
                'pickup_hours',
                'pickup_instructions',
                'contact_number',
            ]);
        });
    }
};