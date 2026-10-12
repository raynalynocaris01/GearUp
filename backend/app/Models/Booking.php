<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'campsite_id',
        'tour_guide_id',
        'gear_item_id',
        'check_in',
        'check_out',
        'gear_start_date',
        'gear_end_date',
        'gear_quantity',
        'guests',
        'total_price',
        'status',
        'notes',
    ];

    protected $casts = [
        'check_in' => 'date',
        'check_out' => 'date',
        'gear_start_date' => 'date',
        'gear_end_date' => 'date',
        'guests' => 'integer',
        'gear_quantity' => 'integer',
        'total_price' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campsite(): BelongsTo
    {
        return $this->belongsTo(Campsite::class);
    }

    public function tourGuide(): BelongsTo
    {
        return $this->belongsTo(TourGuide::class);
    }

    /**
     * Legacy single-gear relation — used by the standalone gear
     * rental flow (one gear item per booking).
     */
    public function gearItem(): BelongsTo
    {
        return $this->belongsTo(GearItem::class);
    }

    /**
     * Multi-gear relation for campsite bookings.
     */
    public function gearItems(): BelongsToMany
    {
        return $this->belongsToMany(GearItem::class, 'booking_gear_items')
            ->withPivot(['quantity', 'price_per_day', 'subtotal'])
            ->withTimestamps();
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }
}