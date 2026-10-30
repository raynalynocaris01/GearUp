<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add down_payment_percent to campsites
        Schema::table('campsites', function (Blueprint $table) {
            $table->integer('down_payment_percent')->default(0)->after('payment_mode');
        });

        // Add amount_paid and balance_due to bookings
        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('amount_paid', 10, 2)->default(0)->after('total_price');
            $table->decimal('balance_due', 10, 2)->default(0)->after('amount_paid');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['amount_paid', 'balance_due']);
        });

        Schema::table('campsites', function (Blueprint $table) {
            $table->dropColumn('down_payment_percent');
        });
    }
};