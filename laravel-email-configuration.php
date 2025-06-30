<?php

// config/mail.php - Email Configuration
return [
    'default' => env('MAIL_MAILER', 'smtp'),
    
    'mailers' => [
        'smtp' => [
            'transport' => 'smtp',
            'host' => env('MAIL_HOST', 'smtp.mailgun.org'),
            'port' => env('MAIL_PORT', 587),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN'),
        ],
        
        'ses' => [
            'transport' => 'ses',
        ],
        
        'mailgun' => [
            'transport' => 'mailgun',
        ],
        
        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],
        
        'array' => [
            'transport' => 'array',
        ],
    ],
    
    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'noreply@campus-resource-booking.com'),
        'name' => env('MAIL_FROM_NAME', 'Campus Resource Booking System'),
    ],
];

// config/auth.php - Authentication Configuration
return [
    'defaults' => [
        'guard' => 'web',
        'passwords' => 'users',
    ],
    
    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
        
        'api' => [
            'driver' => 'sanctum',
            'provider' => 'users',
        ],
    ],
    
    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
    ],
    
    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],
    
    'verification' => [
        'expire' => 60, // minutes
    ],
];

// .env file configuration
/*
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@campus-resource-booking.com
MAIL_FROM_NAME="Campus Resource Booking System"

APP_FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:8000
*/

// routes/api.php - API Routes for Email Verification
Route::middleware('auth:sanctum')->group(function () {
    // Email verification routes
    Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
        $request->fulfill();
        
        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully!',
            'user' => $request->user(),
            'token' => $request->user()->createToken('auth-token')->plainTextToken
        ]);
    })->middleware(['signed'])->name('verification.verify');
    
    Route::post('/email/verification-notification', function (Request $request) {
        $request->user()->sendEmailVerificationNotification();
        
        return response()->json([
            'success' => true,
            'message' => 'Verification link sent! Please check your email.'
        ]);
    })->middleware(['throttle:6,1'])->name('verification.send');
});

// Public resend route (no authentication required)
Route::post('/resend-verification-email', function (Request $request) {
    $request->validate([
        'email' => 'required|email|exists:users,email'
    ]);
    
    $user = \App\Models\User::where('email', $request->email)->first();
    
    if ($user && !$user->hasVerifiedEmail()) {
        $user->sendEmailVerificationNotification();
        return response()->json([
            'success' => true,
            'message' => 'Verification email sent! Please check your inbox.'
        ]);
    }
    
    return response()->json([
        'success' => false,
        'message' => 'User not found or already verified.'
    ], 404);
});

// Alternative verification route (bypasses signature validation for testing)
Route::post('/email/verify-alternative', function (Request $request) {
    $request->validate([
        'id' => 'required',
        'hash' => 'required',
    ]);

    $id = $request->id;
    $hash = $request->hash;

    $user = \App\Models\User::find($id);
    
    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'User not found'
        ], 404);
    }

    if ($user->hasVerifiedEmail()) {
        return response()->json([
            'success' => true,
            'message' => 'Email already verified',
            'user' => $user,
            'token' => $user->createToken('auth-token')->plainTextToken
        ]);
    }

    if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid verification link'
        ], 400);
    }

    $user->markEmailAsVerified();

    return response()->json([
        'success' => true,
        'message' => 'Email verified successfully!',
        'user' => $user,
        'token' => $user->createToken('auth-token')->plainTextToken
    ]);
}); 