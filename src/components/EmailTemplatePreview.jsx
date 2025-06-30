import React, { useState } from 'react';
import logo from '../assets/logo.png';

export default function EmailTemplatePreview() {
    const [userData, setUserData] = useState({
        first_name: 'John',
        email: 'john.doe@example.com'
    });
    const [verificationUrl, setVerificationUrl] = useState('http://localhost:5173/verify-email/1/abc123?expires=1234567890&signature=xyz789');

    const generateEmailTemplate = () => {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification - Campus Resource Booking System</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
                    <img src={logo} />
                    <div class="logo">Mzuzu University Campus Resource Booking System</div>
                    <div class="title">Verify Your Email Address</div>
                </div>
                
                <div class="content">
                    <p>Hello <strong>${userData.first_name} ${userData.last_name}</strong>,</p>
                    
                    <p>Thank you for registering with our Campus Resource Booking System! To complete your registration and start booking resources, please verify your email address by clicking the button below.</p>
                    
                    <div style="text-align: center;">
                        <a href="${verificationUrl}" class="button">Verify Email Address</a>
                    </div>
                    
                    <div class="warning">
                        <strong>Important:</strong> This verification link will expire in 60 minutes. If you don't verify your email within this time, you'll need to request a new verification link.
                    </div>
                    
                    <p>If you did not create an account with our system, please ignore this email. No action is required.</p>
                    
                    <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
                </div>
                
                <div class="footer">
                    <p>Best regards,<br>
                    <strong>Campus Resource Management Team</strong></p>
                    
                    <p>This is an automated message. Please do not reply to this email.</p>
                    
                    <p>If you have any questions, please contact our support team.</p>
                </div>
            </div>
        </body>
        </html>`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateEmailTemplate());
        alert('Email template copied to clipboard!');
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Email Template Preview</h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                value={userData.first_name}
                                onChange={(e) => setUserData(prev => ({ ...prev, first_name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={userData.email}
                                onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Verification URL
                        </label>
                        <input
                            type="text"
                            value={verificationUrl}
                            onChange={(e) => setVerificationUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={copyToClipboard}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Copy Template to Clipboard
                        </button>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Email Preview</h2>
                    </div>
                    <div 
                        className="p-6"
                        dangerouslySetInnerHTML={{ __html: generateEmailTemplate() }}
                    />
                </div>
            </div>
        </div>
    );
} 