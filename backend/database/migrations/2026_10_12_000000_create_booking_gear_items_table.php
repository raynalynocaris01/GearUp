<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_gear_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')
                ->constrained('bookings')
                ->cascadeOnDelete();
            $table->foreignId('gear_item_id')
                ->constrained('gear_items')
                ->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('price_per_day', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();

            $table->unique(['booking_id', 'gear_item_id']);
        });

        // Backfill existing single-gear bookings into the pivot table.
        // Each existing booking with a gear_item_id becomes one pivot row
        // with quantity from bookings.gear_quantity and price snapshot
        // from the gear item's current price_per_day.
        $existing = DB::table('bookings')
            ->join('gear_items', 'gear_items.id', '=', 'bookings.gear_item_id')
            ->whereNotNull('bookings.gear_item_id')
            ->select([
                'bookings.id as booking_id',
                'bookings.gear_item_id',
                'bookings.gear_quantity',
                'bookings.check_in',
                'bookings.check_out',
                'bookings.gear_start_date',
                'bookings.gear_end_date',
                'gear_items.price_per_day',
            ])
            ->get();

        foreach ($existing as $row) {
            $start = $row->gear_start_date
                ?? $row->check_in
                ?? now()->toDateString();
            $end = $row->gear_end_date
                ?? $row->check_out
                ?? $start;

            $days = max(
                1,
                (new \DateTime($start))->diff(new \DateTime($end))->days,
            );
            $qty = $row->gear_quantity ?? 1;
            $subtotal = (float) $row->price_per_day * $days * $qty;

            DB::table('booking_gear_items')->insert([
                'booking_id' => $row->booking_id,
                'gear_item_id' => $row->gear_item_id,
                'quantity' => $qty,
                'price_per_day' => $row->price_per_day,
                'subtotal' => $subtotal,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_gear_items');
    }
};