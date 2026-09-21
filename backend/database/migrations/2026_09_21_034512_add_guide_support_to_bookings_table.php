<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Campsite is now optional (guide-only bookings have no campsite)
            $table->foreignId('campsite_id')->nullable()->change();

            // Optional tour guide
            $table->foreignId('tour_guide_id')
                ->nullable()
                ->after('campsite_id')
                ->constrained('tour_guides')
                ->nullOnDelete();

            // Dates become optional (guide-only bookings may have a single date)
            $table->date('check_in')->nullable()->change();
            $table->date('check_out')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['tour_guide_id']);
            $table->dropColumn('tour_guide_id');
            $table->foreignId('campsite_id')->nullable(false)->change();
            $table->date('check_in')->nullable(false)->change();
            $table->date('check_out')->nullable(false)->change();
        });
    }
};