<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_guides', function (Blueprint $table) {
            $table->string('payment_mode')->default('online')->after('price_per_trip');
            $table->decimal('down_payment_percent', 5, 2)->default(0)->after('payment_mode');
        });
    }

    public function down(): void
    {
        Schema::table('tour_guides', function (Blueprint $table) {
            $table->dropColumn(['payment_mode', 'down_payment_percent']);
        });
    }
};