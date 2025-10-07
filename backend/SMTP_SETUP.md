# SMTP Setup for Gmail OTP Emails

## How to Get Gmail App Password for SMTP

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the setup process to enable 2FA if not already enabled

### Step 2: Generate App Password
1. After enabling 2FA, go back to Security settings
2. Under "Signing in to Google", click on "App passwords"
3. You might need to re-enter your password
4. Select "Mail" from the dropdown
5. Select "Other" and type "ICPAC Booking System"
6. Click "Generate"
7. Google will display a 16-character password like: `abcd efgh ijkl mnop`

### Step 3: Update .env File
1. Copy the generated 16-character password
2. Update your `.env` file:

```env
# Email Settings for OTP
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
DEFAULT_FROM_EMAIL=ICPAC Booking System <your-email@gmail.com>
```

**Important Notes:**
- Use the 16-character app password, NOT your regular Gmail password
- Remove spaces from the app password when copying
- Keep this password secure and don't share it

### Step 4: Test Email Configuration
1. Restart your Django server
2. Try the login/signup flow
3. Check that OTP emails are being sent

### For Development/Testing
If you want to see OTP codes in the console instead of sending real emails:

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

This will print emails to the Django console instead of sending them.

## Troubleshooting

### "Authentication failed" error
- Make sure 2FA is enabled on your Google account
- Verify the app password is correct (16 characters, no spaces)
- Check that EMAIL_HOST_USER matches the Gmail account

### "Less secure app access" error
- This shouldn't happen with app passwords
- If it does, use app passwords instead of regular password

### Emails not being received
- Check spam folder
- Verify recipient email address
- Test with console backend first
- Check Django logs for error messages