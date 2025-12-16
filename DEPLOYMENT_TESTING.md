# Deployment Testing Guide

This guide explains how to test and verify your deployment of the Thesis Management System.

## Pre-Deployment Checklist

Before deploying, ensure you have:

1. ✅ Updated `requirements.txt` with PostgreSQL dependencies
2. ✅ Modified `settings.py` to support both MySQL and PostgreSQL
3. ✅ Created `build.sh` for Render deployment
4. ✅ Created `render.yaml` for automatic database provisioning
5. ✅ Prepared environment variables for all services
6. ✅ Committed all changes to your Git repository

## Deployment Order

Deploy services in this order:

1. **Backend** (Render) - This will automatically create the database
2. **Frontend** (Vercel/Netlify) - After backend URL is available
3. **Database** - Automatically provisioned with backend

## Testing Steps

### 1. Backend Testing

After deploying the backend:

1. Visit your backend URL: `https://your-backend-url.onrender.com`
2. Check that the Django welcome page loads
3. Visit the API endpoint: `https://your-backend-url.onrender.com/api/`
4. Verify you get a JSON response with API endpoints
5. Check the admin panel: `https://your-backend-url.onrender.com/admin/`

### 2. Database Testing

Verify the database is working:

1. Go to your Render dashboard
2. Check that the database status is "Available"
3. Check database metrics for connections and usage
4. Run a test migration if needed:
   ```bash
   render run python backend/manage.py migrate
   ```

### 3. Frontend Testing

After deploying the frontend:

1. Visit your frontend URL
2. Check that the homepage loads correctly
3. Verify there are no console errors
4. Test navigation between pages

### 4. Integration Testing

Test the connection between frontend and backend:

1. Try to log in or register a user
2. Check that API calls are successful
3. Verify that data loads correctly
4. Test form submissions

## Common Issues and Solutions

### Backend Issues

**Issue**: Application crashes on startup
**Solution**: 
1. Check Render logs for error messages
2. Verify all environment variables are set
3. Ensure `build.sh` runs without errors

**Issue**: Build process fails (Exited with status 1)
**Solution**:
1. Check if `DJANGO_SETTINGS_MODULE` is properly set in the build script
2. Verify that all dependencies in `requirements.txt` install correctly
3. Ensure the build script commands are formatted correctly for the Render environment
4. Check that database migrations can run without connecting to the database during build

**Issue**: Database connection fails
**Solution**:
1. Verify `DATABASE_URL` environment variable is present
2. Check database status in Render dashboard
3. Ensure the database is not paused due to inactivity

### Frontend Issues

**Issue**: Blank page or loading forever
**Solution**:
1. Check browser console for errors
2. Verify `VITE_API_BASE_URL` points to correct backend
3. Check that all environment variables are set in Vercel/Netlify

**Issue**: API calls failing
**Solution**:
1. Check browser network tab for failed requests
2. Verify CORS settings in backend
3. Ensure backend URL is accessible

### Database Issues

**Issue**: Migrations fail
**Solution**:
1. Check database connection settings
2. Verify database user has proper permissions
3. Run migrations manually if needed

## Performance Testing

### Backend Performance

1. Monitor Render metrics for:
   - CPU usage
   - Memory usage
   - Response times

2. Test with multiple concurrent users if possible

### Frontend Performance

1. Use browser dev tools to check:
   - Page load times
   - Bundle sizes
   - Network requests

2. Optimize images and assets if needed

## Monitoring and Maintenance

### Setting Up Alerts

1. **Render**:
   - Set up email alerts for service downtime
   - Configure custom health checks

2. **Vercel/Netlify**:
   - Enable deployment notifications
   - Set up performance monitoring

### Regular Maintenance

1. **Database**:
   - Monitor storage usage
   - Take regular backups
   - Run database maintenance tasks

2. **Backend**:
   - Monitor logs for errors
   - Update dependencies regularly
   - Review security settings

3. **Frontend**:
   - Monitor for broken links
   - Check for console errors
   - Update dependencies

## Rollback Procedures

### Backend Rollback

1. Go to Render dashboard
2. Select your service
3. Go to "Manual Deploy" > "Previous Deployments"
4. Select a previous working deployment
5. Click "Deploy"

### Frontend Rollback

**Vercel**:
1. Go to Vercel dashboard
2. Select your project
3. Go to "Deployments" tab
4. Find a previous deployment
5. Click the dropdown menu and select "Rollback"

**Netlify**:
1. Go to Netlify dashboard
2. Select your site
3. Go to "Deploys" tab
4. Find a previous deployment
5. Click "Publish deploy"

## Post-Deployment Verification

### User Testing

1. Test all user roles:
   - Student
   - Adviser
   - Panel member
   - Admin

2. Test core workflows:
   - Login/logout
   - Thesis creation
   - Document upload
   - Group formation
   - Schedule management

### Security Testing

1. Verify HTTPS is enabled
2. Check that sensitive data is not exposed
3. Test authentication and authorization
4. Verify CORS settings are appropriate

### Final Checklist

Before considering deployment complete:

- [ ] All services are running without errors
- [ ] Users can register and log in
- [ ] Core functionality works for all user roles
- [ ] API endpoints respond correctly
- [ ] Database is storing data properly
- [ ] Frontend communicates with backend
- [ ] Google OAuth works
- [ ] Email notifications are sent
- [ ] Performance is acceptable
- [ ] Monitoring and alerts are set up

## Support and Troubleshooting

If you encounter issues:

1. Check the logs for all services
2. Verify environment variables
3. Test connectivity between services
4. Consult the Render, Vercel, or Netlify documentation
5. Reach out to support if needed