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
        'pickup_method',
        'pickup_address',
        'pickup_landmark',
        'pickup_hours',
        'pickup_instructions',
        'contact_number',
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

    /**
     * Human-readable pickup method label.
     */
    public function pickupMethodLabel(): string
    {
        return match ($this->pickup_method) {
            'meetup' => 'Meet-up at a place',
            'pickup' => 'Pick up at owner',
            'deliver' => 'Deliver to you',
            'all' => 'Meet-up, pick up, or delivery',
            default => 'Meet-up at a place',
        };
    }

    /**
     * Short, privacy-safe summary for the public gear details page.
     * Returns e.g. "Meet-up in Apolong, Valencia".
     */
    public function pickupSummary(): string
    {
        $method = match ($this->pickup_method) {
            'pickup' => 'Pick up at',
            'deliver' => 'Deliver in',
            'all' => 'Meet-up / pickup / delivery in',
            default => 'Meet-up in',
        };

        $city = $this->pickupCity();

        return $city
            ? $method . ' ' . $city
            : $this->pickupMethodLabel();
    }

    /**
     * Best-effort city extraction from pickup_address.
     * Splits on the last comma — most PH addresses are
     * "Street, Barangay, City, Province".
     */
    public function pickupCity(): ?string
    {
        if (!$this->pickup_address) {
            return null;
        }
        $parts = array_map('trim', explode(',', $this->pickup_address));
        return $parts[count($parts) >= 2 ? count($parts) - 2 : 0] ?? null;
    }
}