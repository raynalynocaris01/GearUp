<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuideApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'tour_guide_id',
        'applicant_user_id',
        'submitted_by_user_id',
        'submission_source',
        'resume_url',
        'resume_uploaded_at',
        'status',
        'rejection_reason',
        'reviewed_by_user_id',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'resume_uploaded_at' => 'datetime',
            'reviewed_at'        => 'datetime',
        ];
    }

    // ──────────────────────────────────────────────────────────
    // Relations
    // ──────────────────────────────────────────────────────────

    /**
     * The guide profile that was created (or will be created) from
     * this application. Null while status is pending / under_review /
     * rejected. Set once status becomes approved or auto_approved.
     */
    public function tourGuide(): BelongsTo
    {
        return $this->belongsTo(TourGuide::class, 'tour_guide_id');
    }

    /**
     * The user who is applying to become a guide.
     */
    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applicant_user_id');
    }

    /**
     * Who submitted this application: the applicant themselves,
     * the owner who created them, or an admin.
     */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    /**
     * The admin who approved or rejected this application.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    // ──────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return in_array($this->status, ['pending', 'under_review'], true);
    }

    public function isApproved(): bool
    {
        return in_array($this->status, ['approved', 'auto_approved'], true);
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}