<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampsitePhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'campsite_id',
        'image_url',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function campsite(): BelongsTo
    {
        return $this->belongsTo(Campsite::class);
    }
}