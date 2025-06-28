<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Email verification routes
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    
    return response()->json([
        'message' => 'Email verified successfully!',
        'user' => $request->user(),
        'token' => $request->user()->createToken('auth-token')->plainTextToken
    ]);
})->middleware(['auth:sanctum', 'signed'])->name('verification.verify');

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    
    return response()->json([
        'message' => 'Verification link sent! Please check your email.'
    ]);
})->middleware(['auth:sanctum', 'throttle:6,1'])->name('verification.send');

// Alternative public resend route (if needed)
Route::post('/resend-verification-email', function (Request $request) {
    $request->validate([
        'email' => 'required|email|exists:users,email'
    ]);
    
    $user = \App\Models\User::where('email', $request->email)->first();
    
    if ($user && !$user->hasVerifiedEmail()) {
        $user->sendEmailVerificationNotification();
        return response()->json(['message' => 'Verification email sent!']);
    }
    
    return response()->json(['message' => 'User not found or already verified.'], 404);
});

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Admin routes
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    // Your other protected routes here
}); 