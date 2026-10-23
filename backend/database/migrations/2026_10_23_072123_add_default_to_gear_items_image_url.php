<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Make image_url nullable with an empty string default.
        // The two-step save flow creates the gear row first (without an image),
        // then uploads the image via a separate endpoint.
        DB::statement("ALTER TABLE gear_items MODIFY COLUMN image_url VARCHAR(2048) NULL DEFAULT ''");
    }

    public function down(): void
    {
        // Restore the original NOT NULL constraint (no default).
        DB::statement("ALTER TABLE gear_items MODIFY COLUMN image_url VARCHAR(2048) NOT NULL");
    }
};