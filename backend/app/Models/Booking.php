<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function gearItem(): BelongsTo
    {
        return $this->belongsTo(GearItem::class);
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }
}