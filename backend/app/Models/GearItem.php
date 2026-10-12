<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GearItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'description',
        'category',
        'price_per_day',
        'image_url',
        'stock',
        'is_available',
    ];

    protected $casts = [
        'price_per_day' => 'decimal:2',
        'stock' => 'integer',
        'is_available' => 'boolean',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Legacy single-gear relation — the standalone gear rental flow.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Multi-gear pivot relation — campsite bookings that include
     * this gear item as one of several lines.
     */
    public function bookingLines(): BelongsToMany
    {
        return $this->belongsToMany(Booking::class, 'booking_gear_items')
            ->withPivot(['quantity', 'price_per_day', 'subtotal'])
            ->withTimestamps();
    }
}