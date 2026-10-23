<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Make image_url nullable with empty string default.
        // Uses Schema builder (portable) instead of raw ALTER...MODIFY
        // so it works on both MySQL and SQLite (used by PHPUnit tests).
        Schema::table('gear_items', function (Blueprint $table) {
            $table->string('image_url', 2048)->nullable()->default('')->change();
        });
    }

    public function down(): void
    {
        Schema::table('gear_items', function (Blueprint $table) {
            $table->string('image_url', 2048)->nullable(false)->default(null)->change();
        });
    }
};