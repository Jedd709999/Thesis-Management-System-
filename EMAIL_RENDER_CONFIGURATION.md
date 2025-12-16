# Email Configuration for Render Deployment

## Overview
This document explains how to configure email settings for your Thesis Management System when deployed on Render.

## Why Email Configuration is Needed
The application requires email functionality for:
- User registration verification
- Password reset emails
- System notifications

## Configuring Email Settings in Render Dashboard

1. Go to your Render dashboard
2. Navigate to your Thesis Management System web service
3. Click on "Environment Variables" in the sidebar
4. Add the following environment variables:

### Required Email Variables
```
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your_email@gmail.com
```

### Optional Email Variables (can use defaults)
```
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

## Using Gmail SMTP (Recommended)

### Prerequisites
1. A Gmail account
2. 2-Factor Authentication enabled
3. An App Password generated for the application

### Setting up Gmail App Password
1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to Security
3. Under "Signing in to Google," select "App passwords"
4. Enter a name for the app (e.g., "Thesis Management System")
5. Copy the generated 16-character app password
6. Use this as your `EMAIL_HOST_PASSWORD` value

## Alternative Email Providers

### Outlook/Hotmail
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Yahoo Mail
```
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

## Deploying Changes

After adding the environment variables:
1. Click "Save Changes"
2. Trigger a new deployment by pushing to your repository or manually deploying
3. Wait for the deployment to complete
4. Test by registering a new user

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check that all environment variables are set correctly
2. **Authentication failures**: Ensure you're using an App Password, not your regular Gmail password
3. **Connection timeouts**: Verify your firewall settings allow outbound connections on port 587

### Checking Logs
You can check your application logs in the Render dashboard to see any email-related errors:
1. Go to your Render dashboard
2. Navigate to your Thesis Management System web service
3. Click on "Logs" in the sidebar
4. Look for any error messages related to email sending

## Development vs Production

In development mode (DEBUG=True), emails are printed to the console instead of being sent. This is helpful for testing without configuring actual email credentials.

In production mode (DEBUG=False), actual email sending is attempted using the configured SMTP settings.