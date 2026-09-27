<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('gear_item_id')
                ->nullable()
                ->after('tour_guide_id')
                ->constrained('gear_items')
                ->nullOnDelete();

            // Gear rentals use a rental period that may differ from stay dates
            $table->date('gear_start_date')->nullable()->after('check_out');
            $table->date('gear_end_date')->nullable()->after('gear_start_date');
            $table->integer('gear_quantity')->nullable()->after('gear_end_date');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['gear_item_id']);
            $table->dropColumn(['gear_item_id', 'gear_start_date', 'gear_end_date', 'gear_quantity']);
        });
    }
};