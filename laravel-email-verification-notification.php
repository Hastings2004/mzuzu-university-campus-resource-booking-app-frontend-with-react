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

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify Your Email Address - Campus Resource Booking System')
            ->html($this->buildEmailTemplate($notifiable, $verificationUrl));
    }

    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl($notifiable)
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        
        // Create the signed URL for the backend
        $verifyUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
            false // Don't generate absolute URL
        );

        // Extract the path and query from the signed URL
        $parsedUrl = parse_url($verifyUrl);
        $path = $parsedUrl['path'] ?? '';
        $query = $parsedUrl['query'] ?? '';
        
        // Convert backend API path to frontend path
        // From: /api/email/verify/{id}/{hash}?expires=...&signature=...
        // To: /verify-email?id=...&hash=...&expires=...&signature=...
        
        // Extract id and hash from path
        $pathParts = explode('/', trim($path, '/'));
        $id = end($pathParts);
        $hash = prev($pathParts);
        
        // Build frontend URL with query parameters
        $frontendQuery = "id={$id}&hash={$hash}";
        if ($query) {
            $frontendQuery .= "&{$query}";
        }
        
        return $frontendUrl . '/verify-email?' . $frontendQuery;
    }

    /**
     * Build the HTML email template.
     */
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

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
} 