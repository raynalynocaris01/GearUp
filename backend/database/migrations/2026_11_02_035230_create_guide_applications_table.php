<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guide_applications', function (Blueprint $table) {
            $table->id();

            // The guide profile this application is for.
            // NOTE: no FK here — tour_guides.application_id points back
            // to this table, and a circular FK would break fresh migrations.
            // The link is maintained via tour_guides.application_id.
            $table->unsignedBigInteger('tour_guide_id')->nullable();

            // The user being made a guide.
            $table->foreignId('applicant_user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Who submitted the application (self, owner, or admin).
            $table->foreignId('submitted_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Where the application came from.
            $table->enum('submission_source', [
                'self_signup',
                'customer_upgrade',
                'owner_created',
                'admin_created',
            ]);

            // Resume file path on the 'local' disk.
            // Null only for admin_created applications without a resume.
            $table->string('resume_url', 2048)->nullable();

            $table->timestamp('resume_uploaded_at')->nullable();

            // Review lifecycle.
            $table->enum('status', [
                'pending',
                'under_review',
                'approved',
                'rejected',
                'auto_approved',
            ])->default('pending');

            $table->text('rejection_reason')->nullable();

            $table->foreignId('reviewed_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->index('tour_guide_id');
            $table->index('status');
            $table->index('submission_source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guide_applications');
    }
};