<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campsite extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'description',
        'location',
        'region',
        'latitude',     
        'longitude', 
        'price_per_night',
        'price_unit',
        'image_url',
        'rating',
        'reviews_count',
        'capacity',
        'is_featured',
    ];

    protected $casts = [
    'price_per_night' => 'decimal:2',
    'rating' => 'decimal:2',
    'reviews_count' => 'integer',
    'capacity' => 'integer',
    'is_featured' => 'boolean',
    'latitude' => 'float',    
    'longitude' => 'float',   
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
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