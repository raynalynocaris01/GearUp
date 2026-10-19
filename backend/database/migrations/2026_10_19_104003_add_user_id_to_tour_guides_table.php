<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_guides', function (Blueprint $table) {
            // Link the guide profile to a user account so they can log in
            // and receive notifications when someone books them.
            $table->foreignId('user_id')
                ->nullable()
                ->after('created_by')
                ->constrained('users')
                ->nullOnDelete();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('tour_guides', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropIndex(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};