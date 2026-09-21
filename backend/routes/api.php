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
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\TourGuideController;

// ─── Public ──────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::get('/campsites', [CampsiteController::class, 'index']);
Route::get('/campsites/{campsite}', [CampsiteController::class, 'show']);
Route::get('/campsites/{campsite}/reviews', [ReviewController::class, 'index']);
Route::get('/tour-guides', [TourGuideController::class, 'index']);
Route::get('/tour-guides/{tourGuide}', [TourGuideController::class, 'show']);

// ─── Authenticated (any role) ────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user',   [AuthController::class, 'user']);
    Route::post('/logout',[AuthController::class, 'logout']);

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

    // Bookings
    Route::get('/bookings',                          [OwnerBookingController::class, 'index']);
    Route::post('/bookings/{booking}/confirm',       [OwnerBookingController::class, 'confirm']);
    Route::post('/bookings/{booking}/cancel',        [OwnerBookingController::class, 'cancel']);
    Route::post('/bookings/{booking}/complete',      [OwnerBookingController::class, 'complete']);
});


// ─── Admin only ──────────────────────────────────────────
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

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
});