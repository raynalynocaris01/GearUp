<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Per-user pickup info. Applies to every gear item this user
            // has listed (owner_id matches). Nullable — users who never
            // rent out gear don't need it.
            // 'meetup' | 'pickup' | 'deliver' | 'all'
            $table->string('pickup_method', 20)->nullable()->after('avatar_url');
            $table->text('pickup_address')->nullable()->after('pickup_method');
            $table->string('pickup_landmark', 255)->nullable()->after('pickup_address');
            $table->string('pickup_hours', 255)->nullable()->after('pickup_landmark');
            $table->text('pickup_instructions')->nullable()->after('pickup_hours');
            $table->string('pickup_contact_number', 30)->nullable()->after('pickup_instructions');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'pickup_method',
                'pickup_address',
                'pickup_landmark',
                'pickup_hours',
                'pickup_instructions',
                'pickup_contact_number',
            ]);
        });
    }
};