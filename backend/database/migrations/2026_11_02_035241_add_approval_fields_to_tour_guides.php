<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_guides', function (Blueprint $table) {
            // Approval gate for public listing and booking.
            // Existing rows (pre-feature) default to 'legacy' so they
            // stay bookable but don't appear in the review queue.
            $table->enum('approval_status', [
                'approved',
                'pending',
                'under_review',
                'rejected',
                'legacy',
            ])->default('legacy')->after('is_independent');

            // The active application that produced / manages this guide.
            // Nullable: legacy guides have no application.
            $table->foreignId('application_id')
                ->nullable()
                ->after('approval_status')
                ->constrained('guide_applications')
                ->nullOnDelete();
        });

        // Defensive backfill — idempotent, no-op on empty table.
        DB::table('tour_guides')
            ->whereNull('approval_status')
            ->update(['approval_status' => 'legacy']);
    }

    public function down(): void
    {
        Schema::table('tour_guides', function (Blueprint $table) {
            $table->dropForeign(['application_id']);
            $table->dropColumn(['approval_status', 'application_id']);
        });
    }
};