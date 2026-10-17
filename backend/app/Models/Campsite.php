<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campsite extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'parent_campsite_id',
        'name',
        'description',
        'location',
        'region',
        'latitude',     
        'longitude', 
        'price_per_night',
        'price_unit',
        'pricing_mode',
        'image_url',
        'rating',
        'reviews_count',
        'capacity',
        'is_featured',
        'is_available',
    ];

    protected $casts = [
    'price_per_night' => 'decimal:2',
    // 'pricing_mode' is a string, no cast needed
    'rating' => 'decimal:2',
    'reviews_count' => 'integer',
    'capacity' => 'integer',
    'is_featured' => 'boolean',
    'is_available' => 'boolean',
    'latitude' => 'float',    
    'longitude' => 'float',   
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * If this campsite is a sub-listing (e.g. a room), returns the
     * main campsite it belongs to.
     */
    public function parent()
    {
        return $this->belongsTo(Campsite::class, 'parent_campsite_id');
    }

    /**
     * Sub-listings grouped under this campsite (e.g. rooms).
     */
    public function children()
    {
        return $this->hasMany(Campsite::class, 'parent_campsite_id');
    }

    /**
     * Itemized pricing lines for 'detailed' mode campsites.
     */
    public function pricingLines()
    {
        return $this->hasMany(PricingLine::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function tourGuides()
    {
        return $this->hasMany(TourGuide::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
    
    public function reviews()
{
    return $this->hasMany(Review::class);
}
}