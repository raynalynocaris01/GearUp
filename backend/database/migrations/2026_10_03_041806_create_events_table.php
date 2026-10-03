<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
       public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->text('description');
            $table->string('location');
            $table->string('region')->nullable();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->decimal('price_per_person', 10, 2)->default(0);
            $table->integer('capacity')->default(10);
            $table->string('image_url');
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
        public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
