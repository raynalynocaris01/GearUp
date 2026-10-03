<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CampsiteController;
use App\Http\Controllers\Owner\BookingController as OwnerBookingController;
use App\Http\Controllers\Owner\CampsiteController as OwnerCampsiteController;
use App\Http\Controllers\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\Owner\TourGuideController as OwnerTourGuideController;
use App\Http\Controllers\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\CampsiteController as AdminCampsiteController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
 use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\TourGuideController;
use App\Http\Controllers\GearItemController;
use App\Http\Controllers\Owner\GearItemController as OwnerGearItemController;
use App\Http\Controllers\Owner\ReviewController as OwnerReviewController;
use App\Http\Controllers\Owner\SettingsController as OwnerSettingsController;
use App\Http\Controllers\EventController;
 use App\Http\Controllers\EventRegistrationController;
use App\Http\Controllers\My\GearItemController as MyGearItemController;
use App\Http\Controllers\My\GearBookingController as MyGearBookingController;
use App\Http\Controllers\Owner\EventRegistrationController as OwnerEventRegistrationController;


// ─── Public ──────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::get('/campsites', [CampsiteController::class, 'index']);
Route::get('/campsites/{campsite}', [CampsiteController::class, 'show']);
Route::get('/campsites/{campsite}/reviews', [ReviewController::class, 'index']);
Route::get('/tour-guides', [TourGuideController::class, 'index']);
Route::get('/tour-guides/{tourGuide}', [TourGuideController::class, 'show']);
Route::get('/gear', [GearItemController::class, 'index']);
Route::get('/gear/{gearItem}', [GearItemController::class, 'show']);
Route::get('/events', [\App\Http\Controllers\EventController::class, 'index']);
Route::get('/events/{event}', [\App\Http\Controllers\EventController::class, 'show']);
Route::get('/home/recommended', [\App\Http\Controllers\HomeController::class, 'recommended']);

// ─── Authenticated (any role) ────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user',   [AuthController::class, 'user']);
    Route::post('/logout',[AuthController::class, 'logout']);

    // Event registrations (customer)
    Route::get('/my/events', [EventRegistrationController::class, 'mine']);
    Route::post('/events/{event}/register', [EventRegistrationController::class, 'store']);
    Route::post('/registrations/{registration}/cancel', [EventRegistrationController::class, 'cancel']);
    Route::get('/events/{event}/registration-status', [EventRegistrationController::class, 'status']);

    // My Gear (any authenticated user can list and manage their own gear)
    Route::get('/my/gear', [MyGearItemController::class, 'index']);
    Route::post('/my/gear', [MyGearItemController::class, 'store']);
    Route::get('/my/gear/{gearItem}', [MyGearItemController::class, 'show']);
    Route::put('/my/gear/{gearItem}', [MyGearItemController::class, 'update']);
    Route::delete('/my/gear/{gearItem}', [MyGearItemController::class, 'destroy']);
    Route::get('/my/gear-bookings', [MyGearBookingController::class, 'index']);
    Route::post('/my/gear-bookings/{booking}/confirm', [MyGearBookingController::class, 'confirm']);
    Route::post('/my/gear-bookings/{booking}/complete', [MyGearBookingController::class, 'complete']);
    Route::post('/my/gear-bookings/{booking}/cancel', [MyGearBookingController::class, 'cancel']);

    // Customer bookings
    Route::get('/bookings',                   [BookingController::class, 'index']);
    Route::post('/bookings',                  [BookingController::class, 'store']);
    Route::get('/bookings/{booking}',         [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);

    // Reviews
    Route::post('/campsites/{campsite}/reviews', [ReviewController::class, 'store']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
});

// ─── Owner only ──────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:owner'])->prefix('owner')->group(function () {
    // Dashboard
    Route::get('/dashboard', [OwnerDashboardController::class, 'index']);
    Route::get('/dashboard/chart', [OwnerDashboardController::class, 'chart']);

    // Campsites
    Route::get('/campsites',              [OwnerCampsiteController::class, 'index']);
    Route::post('/campsites',             [OwnerCampsiteController::class, 'store']);
    Route::get('/campsites/{campsite}',   [OwnerCampsiteController::class, 'show']);
    Route::put('/campsites/{campsite}',   [OwnerCampsiteController::class, 'update']);
    Route::delete('/campsites/{campsite}',[OwnerCampsiteController::class, 'destroy']);
    Route::post('/campsites/{campsite}/image', [OwnerCampsiteController::class, 'uploadImage']);

    // Tour guides
    Route::get('/campsites/{campsite}/tour-guides',    [OwnerTourGuideController::class, 'index']);
    Route::post('/campsites/{campsite}/tour-guides',   [OwnerTourGuideController::class, 'store']);
    Route::delete('/tour-guides/{tourGuide}',          [OwnerTourGuideController::class, 'destroy']);
    Route::get('/tour-guides',                          [OwnerTourGuideController::class, 'all']);
    Route::post('/tour-guides',                         [OwnerTourGuideController::class, 'storeIndependent']);

    // Reviews
    Route::get('/reviews', [OwnerReviewController::class, 'index']);

    
    // Settings
    Route::put('/settings/profile', [OwnerSettingsController::class, 'updateProfile']);
    Route::post('/settings/password', [OwnerSettingsController::class, 'updatePassword']);


    // Bookings
    Route::get('/bookings',                          [OwnerBookingController::class, 'index']);
    Route::post('/bookings/{booking}/confirm',       [OwnerBookingController::class, 'confirm']);
    Route::post('/bookings/{booking}/cancel',        [OwnerBookingController::class, 'cancel']);
    Route::post('/bookings/{booking}/complete',      [OwnerBookingController::class, 'complete']);
    
    // Gear
    Route::get('/gear',                [OwnerGearItemController::class, 'index']);
    Route::post('/gear',               [OwnerGearItemController::class, 'store']);
    Route::get('/gear/{gearItem}',     [OwnerGearItemController::class, 'show']);
    Route::put('/gear/{gearItem}',     [OwnerGearItemController::class, 'update']);
    Route::delete('/gear/{gearItem}',  [OwnerGearItemController::class, 'destroy']);

        // Events
    Route::get('/events', [\App\Http\Controllers\Owner\EventController::class, 'index']);
    Route::post('/events', [\App\Http\Controllers\Owner\EventController::class, 'store']);
    Route::get('/events/{event}', [\App\Http\Controllers\Owner\EventController::class, 'show']);
    Route::put('/events/{event}', [\App\Http\Controllers\Owner\EventController::class, 'update']);
    Route::delete('/events/{event}', [\App\Http\Controllers\Owner\EventController::class, 'destroy']);

    // Event registrations (owner view)
    Route::get('/events/{event}/registrations', [OwnerEventRegistrationController::class, 'index']);
});


// ─── Admin only ──────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/dashboard/chart', [AdminDashboardController::class, 'chart']);

    // Users
    Route::get('/users',                [AdminUserController::class, 'index']);
    Route::get('/users/{user}',         [AdminUserController::class, 'show']);
    Route::put('/users/{user}',         [AdminUserController::class, 'update']);
    Route::post('/users/{user}/approve',   [AdminUserController::class, 'approve']);
    Route::post('/users/{user}/reject',    [AdminUserController::class, 'reject']);
    Route::post('/users/{user}/suspend',   [AdminUserController::class, 'suspend']);
    Route::post('/users/{user}/reinstate', [AdminUserController::class, 'reinstate']);

    // Campsites
    Route::get('/campsites',                     [AdminCampsiteController::class, 'index']);
    Route::post('/campsites/{campsite}/feature', [AdminCampsiteController::class, 'feature']);
    Route::delete('/campsites/{campsite}',       [AdminCampsiteController::class, 'destroy']);

    // Bookings
    Route::get('/bookings', [AdminBookingController::class, 'index']);

    // Reviews
    Route::get('/reviews', [AdminReviewController::class, 'index']);

    // Events
    Route::get('/events', [AdminEventController::class, 'index']);
});