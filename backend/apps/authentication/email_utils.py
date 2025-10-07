# Using Gmail SMTP for ICPAC Booking System OTP emails
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.core.mail import EmailMultiAlternatives
from django.conf import settings


def send_otp_email(recipient_email, otp_code, user_name=""):
    """Send OTP verification email using Gmail SMTP"""
    try:
        # Get Gmail credentials from environment
        gmail_email = os.environ.get('GMAIL_EMAIL')
        gmail_password = os.environ.get('GMAIL_APP_PASSWORD')

        if not gmail_email or not gmail_password:
            print("Gmail credentials not found in environment variables")
            return False

        # Create email content
        subject = "ICPAC Booking System - Email Verification"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #034930 0%, #065f46 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }}
                .otp-box {{ background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
                .otp-code {{ font-size: 32px; font-weight: bold; color: #034930; letter-spacing: 4px; }}
                .footer {{ background: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }}
                .button {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏢 ICPAC Booking System</h1>
                    <p>Email Verification Required</p>
                </div>

                <div class="content">
                    <h2>Hello{" " + user_name if user_name else ""}!</h2>

                    <p>Thank you for registering with the ICPAC Booking System. To complete your account setup, please verify your email address using the verification code below:</p>

                    <div class="otp-box">
                        <p style="margin: 0; font-weight: 600; color: #065f46;">Your Verification Code</p>
                        <div class="otp-code">{otp_code}</div>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">This code expires in 10 minutes</p>
                    </div>

                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>This code is valid for 10 minutes only</li>
                        <li>Do not share this code with anyone</li>
                        <li>If you didn't request this verification, please ignore this email</li>
                    </ul>

                    <p>Once verified, you'll have full access to:</p>
                    <ul>
                        <li>📅 Book meeting rooms instantly</li>
                        <li>🔒 Secure, domain-restricted access</li>
                        <li>📊 View booking history and analytics</li>
                    </ul>
                </div>

                <div class="footer">
                    <p><strong>ICPAC Climate Prediction and Applications Centre</strong></p>
                    <p>Email: info@icpac.net | Phone: +254 20 7095000</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        ICPAC Booking System - Email Verification

        Hello{" " + user_name if user_name else ""}!

        Thank you for registering with the ICPAC Booking System. To complete your account setup, please verify your email address using the verification code below:

        Your Verification Code: {otp_code}

        This code expires in 10 minutes.

        Important:
        - This code is valid for 10 minutes only
        - Do not share this code with anyone
        - If you didn't request this verification, please ignore this email

        Once verified, you'll have full access to book meeting rooms, view analytics, and more.

        ICPAC Climate Prediction and Applications Centre
        Email: info@icpac.net | Phone: +254 20 7095000

        This is an automated message. Please do not reply to this email.
        """

        # Create and send email using Django's email system with proper headers
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

        print(f"OTP email sent successfully to {recipient_email}")
        return True

    except Exception as e:
        print(f"Error sending OTP email: {str(e)}")
        return False