<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_guides', function (Blueprint $table) {
            // Make campsite optional (independent guides have no campsite)
            $table->foreignId('campsite_id')->nullable()->change();

            // Add pricing + independent flag
            $table->decimal('price_per_trip', 10, 2)->default(0)->after('description');
            $table->boolean('is_independent')->default(false)->after('price_per_trip');
            $table->string('location')->nullable()->after('is_independent'); // For independent guides
        });
    }

    public function down(): void
    {
        Schema::table('tour_guides', function (Blueprint $table) {
            $table->dropColumn(['price_per_trip', 'is_independent', 'location']);
            // Revert campsite_id back to non-nullable
            $table->foreignId('campsite_id')->nullable(false)->change();
        });
    }
};