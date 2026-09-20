<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CampsiteController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::get('/campsites', [CampsiteController::class, 'index']);
Route::get('/campsites/{campsite}', [CampsiteController::class, 'show']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user',   [AuthController::class, 'user']);
    Route::post('/logout',[AuthController::class, 'logout']);

    // Bookings
    Route::get('/bookings',                   [BookingController::class, 'index']);
    Route::post('/bookings',                  [BookingController::class, 'store']);
    Route::get('/bookings/{booking}',         [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
});