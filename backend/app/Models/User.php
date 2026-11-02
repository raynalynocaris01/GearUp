<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'avatar_url',
        'password',
        'role',
        'is_approved',
        'is_suspended',
        'password_must_change',
        'terms_accepted_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_approved' => 'boolean',
            'is_suspended' => 'boolean',
            'password_must_change' => 'boolean',
            'terms_accepted_at' => 'datetime',
        ];
    }

        public function campsites()
    {
        return $this->hasMany(Campsite::class, 'owner_id');
    }

    public function events(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Event::class, 'owner_id');
    }
    
    public function gearItems()
    {
        return $this->hasMany(GearItem::class, 'owner_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    // Helpers
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    public function isGuide(): bool
    {
        return $this->role === 'guide';
    }

    /**
     * The tour guide profile owned by this user (only for role=guide).
     */
    public function guideProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(TourGuide::class, 'user_id');
    }

    /**
     * Guide applications this user has submitted (as the applicant).
     * A user may have multiple applications over time if they were
     * rejected and re-applied, or if their status changed from pending
     * to under_review after a resume upload.
     */
    public function guideApplications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(GuideApplication::class, 'applicant_user_id');
    }

    /**
     * Guide applications this user submitted on behalf of others
     * (as an owner or admin).
     */
    public function submittedGuideApplications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(GuideApplication::class, 'submitted_by_user_id');
    }
}
