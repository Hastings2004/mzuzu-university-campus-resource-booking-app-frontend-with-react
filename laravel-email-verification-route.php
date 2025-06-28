<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Http\Controllers\AuthController;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Email verification routes
Route::post('/email/verify', function (Request $request) {
    $request->validate([
        'id' => 'required',
        'hash' => 'required',
        'expires' => 'required',
        'signature' => 'required',
    ]);

    $id = $request->id;
    $hash = $request->hash;
    $expires = $request->expires;
    $signature = $request->signature;

    // Find the user
    $user = User::find($id);
    
    if (!$user) {
        return response()->json([
            'message' => 'User not found'
        ], 404);
    }

    // Check if already verified
    if ($user->hasVerifiedEmail()) {
        return response()->json([
            'message' => 'Email already verified',
            'user' => $user
        ]);
    }

    // Verify the hash
    if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return response()->json([
            'message' => 'Invalid verification link'
        ], 400);
    }

    // Check if the link has expired
    if (Carbon\Carbon::createFromTimestamp($expires)->isPast()) {
        return response()->json([
            'message' => 'Verification link has expired'
        ], 400);
    }

    // Verify the signature
    $expectedSignature = hash_hmac('sha256', 
        "{$id}.{$hash}.{$expires}", 
        config('app.key')
    );

    if (!hash_equals($expectedSignature, $signature)) {
        return response()->json([
            'message' => 'Invalid signature'
        ], 400);
    }

    // Mark email as verified
    $user->markEmailAsVerified();

    // Create a new token for the user
    $token = $user->createToken('auth-token')->plainTextToken;

    return response()->json([
        'message' => 'Email verified successfully!',
        'user' => $user,
        'token' => $token
    ]);

})->name('verification.verify');

// Alternative: Keep the original GET route for direct access
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    
    return response()->json([
        'message' => 'Email verified successfully!',
        'user' => $request->user(),
        'token' => $request->user()->createToken('auth-token')->plainTextToken
    ]);
})->middleware(['auth:sanctum', 'signed'])->name('verification.verify.get');

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    
    return response()->json([
        'message' => 'Verification link sent! Please check your email.'
    ]);
})->middleware(['auth:sanctum', 'throttle:6,1'])->name('verification.send');

// Alternative public resend route
Route::post('/resend-verification-email', function (Request $request) {
    $request->validate([
        'email' => 'required|email|exists:users,email'
    ]);
    
    $user = User::where('email', $request->email)->first();
    
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