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
        'name',
        'contact_number',
        'email',
        'description',
        'price_per_trip',
        'is_independent',
        'location',
    ];

    protected $casts = [
        'price_per_trip' => 'decimal:2',
        'is_independent' => 'boolean',
    ];

    public function campsite(): BelongsTo
    {
        return $this->belongsTo(Campsite::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}