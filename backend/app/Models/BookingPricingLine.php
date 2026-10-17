<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingPricingLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'pricing_line_id',
        'quantity',
        'amount',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function pricingLine(): BelongsTo
    {
        return $this->belongsTo(PricingLine::class);
    }
}