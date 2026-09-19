<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CampsiteController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::get('/campsites', [CampsiteController::class, 'index']);
Route::get('/campsites/{campsite}', [CampsiteController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user',   [AuthController::class, 'user']);
    Route::post('/logout',[AuthController::class, 'logout']);
});