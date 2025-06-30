# Email Verification Setup Guide

This guide will help you implement the custom email verification system with the provided HTML template for your Campus Resource Booking System.

## Overview

The system consists of:
1. **Laravel Backend**: Handles email sending and verification
2. **React Frontend**: Displays verification results and handles user interactions
3. **Custom Email Template**: Professional HTML email template

## Backend Setup (Laravel)

### 1. Create the Email Verification Notification

Create the file `app/Notifications/VerifyEmailNotification.php`:

```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify Your Email Address - Campus Resource Booking System')
            ->html($this->buildEmailTemplate($notifiable, $verificationUrl));
    }

    protected function verificationUrl($notifiable)
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        
        $verifyUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
            false
        );

        $parsedUrl = parse_url($verifyUrl);
        $path = $parsedUrl['path'] ?? '';
        $query = $parsedUrl['query'] ?? '';
        
        return $frontendUrl . '/verify-email' . $path . ($query ? '?' . $query : '');
    }

    protected function buildEmailTemplate($notifiable, $url)
    {
        return '
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification - Campus Resource Booking System</title>
            <style>
                body {
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2563eb;
                    margin-bottom: 10px;
                }
                .title {
                    color: #1f2937;
                    font-size: 20px;
                    margin-bottom: 20px;
                }
                .content {
                    margin-bottom: 30px;
                }
                .button {
                    display: inline-block;
                    background-color: #2563eb;
                    color: #ffffff;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .button:hover {
                    background-color: #1d4ed8;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    color: #6b7280;
                    font-size: 14px;
                }
                .warning {
                    background-color: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #92400e;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">Campus Resource Booking System</div>
                    <div class="title">Verify Your Email Address</div>
                </div>
                
                <div class="content">
                    <p>Hello <strong>' . htmlspecialchars($notifiable->first_name) . '</strong>,</p>
                    
                    <p>Thank you for registering with our Campus Resource Booking System! To complete your registration and start booking resources, please verify your email address by clicking the button below.</p>
                    
                    <div style="text-align: center;">
                        <a href="' . htmlspecialchars($url) . '" class="button">Verify Email Address</a>
                    </div>
                    
                    <div class="warning">
                        <strong>Important:</strong> This verification link will expire in 60 minutes. If you don\'t verify your email within this time, you\'ll need to request a new verification link.
                    </div>
                    
                    <p>If you did not create an account with our system, please ignore this email. No action is required.</p>
                    
                    <p>If the button above doesn\'t work, you can copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all; color: #2563eb;">' . htmlspecialchars($url) . '</p>
                </div>
                
                <div class="footer">
                    <p>Best regards,<br>
                    <strong>Campus Resource Management Team</strong></p>
                    
                    <p>This is an automated message. Please do not reply to this email.</p>
                    
                    <p>If you have any questions, please contact our support team.</p>
                </div>
            </div>
        </body>
        </html>';
    }

    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
```

### 2. Update User Model

Update your `app/Models/User.php`:

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\VerifyEmailNotification;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'user_type',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function sendEmailVerificationNotification()
    {
        $this->notify(new VerifyEmailNotification);
    }
}
```

### 3. Configure Email Settings

Add to your `.env` file:

```env
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
```

### 4. Add API Routes

Add to your `routes/api.php`:

```php
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

// Email verification routes
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    
    return response()->json([
        'success' => true,
        'message' => 'Email verified successfully!',
        'user' => $request->user(),
        'token' => $request->user()->createToken('auth-token')->plainTextToken
    ]);
})->middleware(['auth:sanctum', 'signed'])->name('verification.verify');

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    
    return response()->json([
        'success' => true,
        'message' => 'Verification link sent! Please check your email.'
    ]);
})->middleware(['auth:sanctum', 'throttle:6,1'])->name('verification.send');

// Public resend route
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

// Alternative verification route (for testing)
Route::post('/email/verify-alternative', function (Request $request) {
    $request->validate([
        'id' => 'required',
        'hash' => 'required',
    ]);

    $user = \App\Models\User::find($request->id);
    
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

    if (!hash_equals(sha1($user->getEmailForVerification()), $request->hash)) {
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
```

## Frontend Setup (React)

### 1. Email Template Preview Component

The `EmailTemplatePreview.jsx` component is already created and allows you to:
- Preview the email template
- Test with different user data
- Copy the template to clipboard

### 2. Update Verification Routes

Make sure your React app has the correct route for email verification:

```jsx
// In your App.jsx or router configuration
<Route path="/verify-email/:id/:hash" element={<VerificationResult />} />
```

### 3. Test the Email Template

You can access the email template preview at `/email-template-preview` (if you add the route) to see how the email will look.

## Testing the System

### 1. Test Email Sending

1. Register a new user
2. Check if the verification email is sent
3. Verify the email template looks correct

### 2. Test Email Verification

1. Click the verification link in the email
2. Verify the user is redirected to the React app
3. Check if the verification status is displayed correctly

### 3. Test Resend Functionality

1. Try resending verification email
2. Verify the email is sent again
3. Check rate limiting (should be 6 emails per minute)

## Troubleshooting

### Common Issues

1. **Email not sending**: Check SMTP configuration in `.env`
2. **Verification link not working**: Ensure frontend URL is correct
3. **Template not displaying**: Check if the notification class is properly imported

### Debug Tools

- Use the `EmailDebug.jsx` component to test email configuration
- Check Laravel logs for email errors
- Use the `EmailTemplatePreview.jsx` to preview the template

## Security Considerations

1. **Rate Limiting**: Verification emails are limited to 6 per minute
2. **Link Expiration**: Links expire after 60 minutes
3. **Signature Validation**: Uses Laravel's signed URLs for security
4. **HTTPS**: Use HTTPS in production for secure links

## Production Deployment

1. Update `.env` with production email settings
2. Set `APP_FRONTEND_URL` to your production domain
3. Configure proper SMTP settings (Gmail, SendGrid, etc.)
4. Test the complete flow in production

## Files Created/Modified

### Backend Files
- `app/Notifications/VerifyEmailNotification.php` (new)
- `app/Models/User.php` (modified)
- `routes/api.php` (modified)
- `.env` (modified)

### Frontend Files
- `src/components/EmailTemplatePreview.jsx` (new)
- `src/auth/VerificationResult.jsx` (existing, working)

This setup provides a complete, professional email verification system with a beautiful HTML template that matches your application's branding. 