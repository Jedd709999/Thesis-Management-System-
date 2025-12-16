# Environment Variables Configuration

This guide explains how to configure environment variables for all services in the Thesis Management System.

## Frontend Environment Variables (Vercel/Netlify)

Create a `.env.production` file in the frontend directory with the following variables:

```env
# Backend API URL (update this after deploying the backend)
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api

# Google OAuth Configuration (update with your production credentials)
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-production-google-client-secret

# Development settings
NODE_ENV=production
```

### Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click on "Settings" > "Environment Variables"
3. Add the following variables:
   - `VITE_API_BASE_URL` - Your deployed backend URL
   - `VITE_GOOGLE_CLIENT_ID` - Your production Google Client ID
   - `VITE_GOOGLE_CLIENT_SECRET` - Your production Google Client Secret

### Netlify Environment Variables

1. Go to your Netlify site dashboard
2. Click on "Site settings" > "Build & deploy" > "Environment"
3. Add the following variables:
   - `VITE_API_BASE_URL` - Your deployed backend URL
   - `VITE_GOOGLE_CLIENT_ID` - Your production Google Client ID
   - `VITE_GOOGLE_CLIENT_SECRET` - Your production Google Client Secret

## Backend Environment Variables (Render)

Set the following environment variables in your Render dashboard:

### Required Variables

1. `DJANGO_SECRET_KEY` - A random secret key for Django security
   - Generate a strong secret key using:
     ```python
     from django.core.management.utils import get_random_secret_key
     print(get_random_secret_key())
     ```

2. `DEBUG` - Set to `False` for production

3. `DATABASE_URL` - Automatically set by Render when using render.yaml

### Google OAuth Variables

4. `GOOGLE_OAUTH2_CLIENT_ID` - Your production Google OAuth client ID
5. `GOOGLE_OAUTH2_CLIENT_SECRET` - Your production Google OAuth client secret

### Email Configuration Variables

6. `EMAIL_HOST` - SMTP server for sending emails (e.g., smtp.gmail.com)
7. `EMAIL_PORT` - SMTP port (e.g., 587)
8. `EMAIL_USE_TLS` - Set to `True`
9. `EMAIL_HOST_USER` - SMTP username
10. `EMAIL_HOST_PASSWORD` - SMTP password
11. `DEFAULT_FROM_EMAIL` - Default sender email address

### Optional Variables

12. `WEB_CONCURRENCY` - Number of worker processes (default: 4)
13. `ALLOWED_HOSTS` - Comma-separated list of allowed hosts (automatically set by Render)

## How to Set Environment Variables on Render

1. Go to your Render dashboard
2. Select your web service
3. Click on "Environment" in the sidebar
4. Add each variable with its corresponding value
5. Click "Save Changes"
6. Redeploy your service for changes to take effect

## Security Best Practices

1. Never commit environment variables to version control
2. Use strong, randomly generated secrets for `DJANGO_SECRET_KEY`
3. Restrict Google OAuth credentials to only your production domains
4. Use environment-specific credentials for email services
5. Regularly rotate sensitive credentials

## Testing Environment Variables

To test your environment variables locally:

1. Create a `.env` file in the backend directory:
   ```env
   DJANGO_SECRET_KEY=your-local-secret-key
   DEBUG=True
   DATABASE_NAME=thesis_db
   DATABASE_USER=thesis_user
   DATABASE_PASSWORD=thesis_pass
   DATABASE_HOST=localhost
   DATABASE_PORT=3306
   ```

2. For the frontend, create a `.env.local` file in the frontend directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_GOOGLE_CLIENT_ID=your-development-google-client-id
   VITE_GOOGLE_CLIENT_SECRET=your-development-google-client-secret
   ```

## Troubleshooting

### Common Issues

1. **API Connection Errors**: Verify `VITE_API_BASE_URL` points to the correct backend URL
2. **Google OAuth Failures**: Ensure redirect URIs are configured correctly in Google Cloud Console
3. **Email Sending Failures**: Check SMTP credentials and firewall settings
4. **Database Connection Issues**: Verify `DATABASE_URL` is correctly formatted

### Debugging Tips

1. Check Render logs for environment variable-related errors
2. Use `console.log(import.meta.env)` in frontend to verify Vite environment variables
3. Add debug prints in Django settings to verify database connection parameters