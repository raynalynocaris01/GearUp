<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Campsite pricing mode toggle
        Schema::table('campsites', function (Blueprint $table) {
            $table->string('pricing_mode', 20)
                ->default('simple')
                ->after('price_unit');
        });

        // Itemized pricing lines for 'detailed' mode campsites
        Schema::create('pricing_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campsite_id')
                ->constrained('campsites')
                ->cascadeOnDelete();
            $table->string('label');
            $table->decimal('amount', 10, 2);
            $table->string('unit', 20);          // per_person | per_tent | per_night | flat
            $table->string('applies_to', 20)->default('any'); // any | adult | child | senior | pwd
            $table->boolean('is_optional')->default(false);
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['campsite_id', 'sort_order']);
        });

        // Pivot: which pricing lines a booking used, with snapshotted amounts
        Schema::create('booking_pricing_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')
                ->constrained('bookings')
                ->cascadeOnDelete();
            $table->foreignId('pricing_line_id')
                ->constrained('pricing_lines')
                ->restrictOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('amount', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();

            $table->index('booking_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_pricing_lines');
        Schema::dropIfExists('pricing_lines');

        Schema::table('campsites', function (Blueprint $table) {
            $table->dropColumn('pricing_mode');
        });
    }
};