<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('room_campsite_id')
                ->nullable()
                ->after('campsite_id')
                ->constrained('campsites')
                ->nullOnDelete();

            $table->index('room_campsite_id');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['room_campsite_id']);
            $table->dropIndex(['room_campsite_id']);
            $table->dropColumn('room_campsite_id');
        });
    }
};