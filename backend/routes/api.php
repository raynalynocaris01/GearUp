<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CampsiteController;
use App\Http\Controllers\Owner\BookingController as OwnerBookingController;
use App\Http\Controllers\Owner\CampsiteController as OwnerCampsiteController;
use App\Http\Controllers\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\Owner\TourGuideController as OwnerTourGuideController;
use Illuminate\Support\Facades\Route;

// ─── Public ──────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::get('/campsites', [CampsiteController::class, 'index']);
Route::get('/campsites/{campsite}', [CampsiteController::class, 'show']);

// ─── Authenticated (any role) ────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user',   [AuthController::class, 'user']);
    Route::post('/logout',[AuthController::class, 'logout']);

    // Customer bookings
    Route::get('/bookings',                   [BookingController::class, 'index']);
    Route::post('/bookings',                  [BookingController::class, 'store']);
    Route::get('/bookings/{booking}',         [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
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

    // Tour guides
    Route::get('/campsites/{campsite}/tour-guides',    [OwnerTourGuideController::class, 'index']);
    Route::post('/campsites/{campsite}/tour-guides',   [OwnerTourGuideController::class, 'store']);
    Route::delete('/tour-guides/{tourGuide}',          [OwnerTourGuideController::class, 'destroy']);

    // Bookings
    Route::get('/bookings',                          [OwnerBookingController::class, 'index']);
    Route::post('/bookings/{booking}/confirm',       [OwnerBookingController::class, 'confirm']);
    Route::post('/bookings/{booking}/cancel',        [OwnerBookingController::class, 'cancel']);
});