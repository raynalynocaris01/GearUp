<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourGuide extends Model
{
    use HasFactory;

    protected $fillable = [
        'campsite_id',
        'created_by',
        'user_id',
        'name',
        'contact_number',
        'email',
        'description',
        'price_per_trip',
        'approval_status',
        'application_id',
        'location',
        'meeting_instructions',
        'facebook_url',
    ];

    protected static function booted(): void
    {
        static::saving(function (TourGuide $guide) {
            // Keep is_independent in sync with campsite_id.
            $guide->is_independent = $guide->campsite_id === null;
        });
    }

    protected $casts = [
        'price_per_trip' => 'decimal:2',
        'is_independent' => 'boolean',
    ];

    public function campsite(): BelongsTo
    {
        return $this->belongsTo(Campsite::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The user account that owns this tour guide profile.
     * Nullable — legacy campsite guides created by owners may not have one.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The application that produced / manages this guide.
     * Null for legacy guides created before the applications feature.
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(GuideApplication::class, 'application_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Scope to guides that are visible on public listings and bookable.
     * Excludes pending, under_review, and rejected.
     * Includes 'legacy' (pre-feature guides grandfather into bookable).
     */
    public function scopeApproved($query)
    {
        return $query->whereIn('approval_status', ['approved', 'legacy']);
    }
}