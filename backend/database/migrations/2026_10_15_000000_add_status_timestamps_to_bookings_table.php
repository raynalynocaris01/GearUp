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
            $table->timestamp('confirmed_at')->nullable()->after('status');
            $table->timestamp('completed_at')->nullable()->after('confirmed_at');
            $table->timestamp('cancelled_at')->nullable()->after('completed_at');
        });

        // Backfill existing bookings based on current status.
        // We only have updated_at to work with, so that's our best guess
        // for when the transition happened. For `confirmed` bookings this
        // is approximate; going forward, timestamps are set explicitly.
        DB::table('bookings')
            ->where('status', 'confirmed')
            ->update(['confirmed_at' => DB::raw('updated_at')]);

        DB::table('bookings')
            ->where('status', 'completed')
            ->update(['completed_at' => DB::raw('updated_at')]);

        DB::table('bookings')
            ->where('status', 'cancelled')
            ->update(['cancelled_at' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['confirmed_at', 'completed_at', 'cancelled_at']);
        });
    }
};