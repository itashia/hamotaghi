<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\RoomController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::get('/rooms/invitations/{code}', [RoomController::class, 'preview'])->middleware('auth:sanctum');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('/auth/password', [AuthController::class, 'changePassword']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/rooms/current', [RoomController::class, 'current']);
        Route::post('/rooms', [RoomController::class, 'store']);
        Route::post('/rooms/join', [RoomController::class, 'join']);
        Route::put('/rooms/{room}/workspace', [RoomController::class, 'updateWorkspace']);
        Route::patch('/rooms/{room}', [RoomController::class, 'update']);
        Route::post('/rooms/{room}/invitation', [RoomController::class, 'regenerateInvitation']);
        Route::delete('/rooms/{room}/members/{user}', [RoomController::class, 'removeMember']);
        Route::post('/rooms/{room}/leave', [RoomController::class, 'leave']);
        Route::post('/rooms/{room}/activity/read', [RoomController::class, 'markActivityRead']);
    });
});
