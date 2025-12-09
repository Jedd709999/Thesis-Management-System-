# Email Configuration for Thesis Management System

## Gmail SMTP Configuration

To enable email verification during user registration, you need to configure SMTP settings. This guide explains how to set up Gmail SMTP.

### Prerequisites

1. A Gmail account
2. 2-Factor Authentication enabled on your Gmail account
3. An App Password generated for the application

### Setting up Gmail App Password

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to Security
3. Under "Signing in to Google," select "App passwords"
4. Enter a name for the app (e.g., "Thesis Management System")
5. Copy the generated 16-character app password

### Environment Variables

Set the following environment variables in your `.env` file or Docker configuration:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

### Docker Configuration

In your `docker-compose.yml`, update the backend service environment variables:

```yaml
environment:
  - EMAIL_HOST=smtp.gmail.com
  - EMAIL_PORT=587
  - EMAIL_USE_TLS=True
  - EMAIL_HOST_USER=your-email@gmail.com
  - EMAIL_HOST_PASSWORD=your-16-char-app-password
  - DEFAULT_FROM_EMAIL=your-email@gmail.com
```

### Testing Email Configuration

After setting up the configuration:

1. Restart your Docker containers:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

2. Try registering a new user to verify that the email is sent correctly.

### Troubleshooting

If emails are not being sent:

1. Check the backend logs:
   ```bash
   docker-compose logs backend
   ```

2. Verify all environment variables are set correctly

3. Ensure your Gmail account settings are correct

4. Check that your app password is valid and hasn't been revoked

### Alternative Email Providers

You can also use other email providers by changing the EMAIL_HOST and related settings:

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

#### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

#### Custom SMTP Server
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587  # or 465 for SSL
EMAIL_USE_TLS=True  # or EMAIL_USE_SSL=True for port 465
```