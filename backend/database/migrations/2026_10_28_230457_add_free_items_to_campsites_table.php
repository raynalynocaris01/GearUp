<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campsites', function (Blueprint $table) {
            $table->json('free_items')->nullable()->after('payment_mode');
        });
    }

    public function down(): void
    {
        Schema::table('campsites', function (Blueprint $table) {
            $table->dropColumn('free_items');
        });
    }
};