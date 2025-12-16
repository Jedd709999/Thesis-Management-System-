# Deployment Instructions for Thesis Management System

This document provides instructions for deploying the Thesis Management System using free hosting services.

## Overview

The Thesis Management System can be deployed using the following free services:

- **Frontend**: Vercel or Netlify
- **Backend**: Render (with Python web service)
- **Database**: Render PostgreSQL (free tier)

## Deployment Guides

Detailed deployment instructions are available in the following documents:

1. [Frontend Deployment Guide](FRONTEND_DEPLOYMENT.md) - Instructions for deploying the React frontend to Vercel or Netlify
2. [Backend Deployment Guide](BACKEND_DEPLOYMENT.md) - Instructions for deploying the Django backend to Render with PostgreSQL
3. [Database Deployment Guide](DATABASE_DEPLOYMENT.md) - Information about Render's PostgreSQL free tier
4. [Environment Variables Guide](ENVIRONMENT_VARIABLES.md) - How to configure environment variables for all services
5. [Deployment Testing Guide](DEPLOYMENT_TESTING.md) - How to test your deployment
6. [Deployment Summary](DEPLOYMENT_SUMMARY.md) - Complete overview of the deployment architecture

## Quick Start

1. **Prepare your code**:
   - Ensure all changes from this repository are committed
   - Generate a secure Django secret key

2. **Deploy the backend first**:
   - Sign up for a Render account
   - Deploy the backend using the `render.yaml` configuration
   - This will automatically provision the PostgreSQL database

3. **Deploy the frontend**:
   - Sign up for either Vercel or Netlify
   - Deploy the frontend with the correct environment variables

4. **Configure environment variables**:
   - Set all required environment variables for both frontend and backend
   - Update the `VITE_API_BASE_URL` in the frontend to point to your Render backend

## Key Changes Made for Deployment

1. **Database Support**:
   - Added support for both MySQL (development) and PostgreSQL (production)
   - Updated `requirements.txt` with PostgreSQL dependencies (`psycopg2-binary`, `dj-database-url`)

2. **Deployment Configuration**:
   - Created `render.yaml` for automatic deployment configuration
   - Created `build.sh` for Render build process
   - Updated Django settings to work with Render's environment variables

## Prerequisites

- Git repository with the complete codebase
- Accounts with Render, Vercel/Netlify
- Production Google OAuth credentials
- SMTP credentials for email functionality

## Support

For detailed instructions, refer to the individual deployment guides linked above. Each guide contains step-by-step instructions and troubleshooting tips.