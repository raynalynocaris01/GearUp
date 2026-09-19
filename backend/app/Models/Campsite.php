<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campsite extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'location',
        'region',
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
    ];
}