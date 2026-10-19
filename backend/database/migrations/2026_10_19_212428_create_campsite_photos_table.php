<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campsite_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campsite_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('image_url');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['campsite_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campsite_photos');
    }
};