<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Frozen snapshot of all price components at booking time.
            // Once written, this must NEVER change — even if the owner
            // later edits the campsite/gear/guide prices.
            $table->json('price_snapshot')->nullable()->after('total_price');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('price_snapshot');
        });
    }
};