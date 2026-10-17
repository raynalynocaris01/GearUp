<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PricingLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'campsite_id',
        'label',
        'amount',
        'unit',
        'applies_to',
        'is_optional',
        'description',
        'sort_order',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_optional' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function campsite(): BelongsTo
    {
        return $this->belongsTo(Campsite::class);
    }
}