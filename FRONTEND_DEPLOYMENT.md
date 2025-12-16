# Frontend Deployment Guide (Vercel/Netlify)

This guide explains how to deploy the frontend application to either Vercel or Netlify.

## Prerequisites

1. A GitHub/GitLab/Bitbucket repository with the frontend code
2. An account with either Vercel or Netlify

## Deployment Steps

### 1. Prepare Environment Variables

Create a `.env.production` file in the frontend directory with the following variables:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
NODE_ENV=production
```

### 2. Build Configuration

The frontend uses Vite and will automatically build with the command:
```bash
npm run build
```

The build output will be in the `dist` directory.

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/sign in
2. Click "New Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: dist
5. Add environment variables in the "Environment Variables" section
6. Click "Deploy"

### 4. Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up/sign in
2. Click "New site from Git"
3. Connect to your Git provider and select your repository
4. Configure the deployment:
   - Base directory: frontend
   - Build command: `npm run build`
   - Publish directory: dist
5. Add environment variables in the "Environment Variables" section
6. Click "Deploy site"

## Important Notes

1. Make sure to update `VITE_API_BASE_URL` to point to your deployed backend URL
2. Configure Google OAuth credentials for production URLs
3. After deployment, verify that the frontend can communicate with the backend