<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->integer('adults')->default(1)->after('guests');
            $table->integer('children')->default(0)->after('adults');
            $table->integer('seniors')->default(0)->after('children');
            $table->integer('pwd')->default(0)->after('seniors');
        });

        // Backfill: every existing booking's `guests` becomes `adults`
        // (since we never had categories before, all guests were "adults").
        DB::statement('UPDATE bookings SET adults = guests WHERE adults = 1 AND guests > 1');
        // ^ Only update where default didn't already match; avoids 1-guest no-ops
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['adults', 'children', 'seniors', 'pwd']);
        });
    }
};