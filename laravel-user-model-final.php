<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

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

    /**
     * Send the email verification notification.
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new CustomVerifyEmail);
    }
}

/**
 * Custom email verification notification
 */
class CustomVerifyEmail extends VerifyEmail
{
    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl($notifiable)
    {
        $frontendUrl = env('APP_FRONTEND_URL', 'http://localhost:5173');
        
        // Create the signed URL for the backend
        $verifyUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        // Extract the path and query parameters
        $parsedUrl = parse_url($verifyUrl);
        $path = $parsedUrl['path'];
        $query = isset($parsedUrl['query']) ? '?' . $parsedUrl['query'] : '';
        
        // Convert backend path to frontend path
        $frontendPath = str_replace('/api/email/verify', '/verify-email', $path);
        
        return $frontendUrl . $frontendPath . $query;
    }

    /**
     * Get the verification email notification mail message for the given URL.
     */
    protected function buildMailMessage($url)
    {
        return $this->subject('Verify Email Address')
                    ->line('Please click the button below to verify your email address.')
                    ->action('Verify Email Address', $url)
                    ->line('If you did not create an account, no further action is required.');
    }
} 