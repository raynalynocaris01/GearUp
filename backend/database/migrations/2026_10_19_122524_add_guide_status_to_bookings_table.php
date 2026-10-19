<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Guide-side confirmation state. Null when the booking has no
            // tour guide. Values: pending | accepted | declined.
            $table->enum('guide_status', ['pending', 'accepted', 'declined'])
                ->nullable()
                ->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('guide_status');
        });
    }
};