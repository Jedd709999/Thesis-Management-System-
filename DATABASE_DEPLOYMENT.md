# Database Deployment Guide (Render PostgreSQL)

This guide explains how to set up a PostgreSQL database on Render for the Thesis Management System.

## About Render's Free PostgreSQL

Render provides a free tier for PostgreSQL databases with the following limitations:
- 1GB storage
- 1GB bandwidth
- 512MB RAM
- Automatic backups
- Idle CPU after 15 minutes of inactivity

## Database Setup

The database setup is handled automatically by Render when you deploy the backend service using the `render.yaml` file we created earlier. The database configuration in that file will:

1. Create a PostgreSQL database named `thesis-db`
2. Set up a user named `thesis_user`
3. Create a database named `thesis_db`

## Manual Database Setup (if needed)

If you need to set up the database manually:

1. Go to [render.com](https://render.com) and sign in
2. Click "New+" and select "PostgreSQL"
3. Configure the database:
   - Name: thesis-db
   - Database name: thesis_db
   - User: thesis_user
   - Region: Choose the closest region
4. Click "Create Database"

## Database Connection

Render will automatically provide a `DATABASE_URL` environment variable to your backend service. This URL contains all the connection information needed for Django to connect to the database.

The format of the DATABASE_URL is:
```
postgres://username:password@host:port/database_name
```

Our Django settings are configured to automatically parse this URL using the `dj-database-url` package.

## Monitoring and Maintenance

### Viewing Database Metrics

1. Go to your database dashboard on Render
2. Click on the "Metrics" tab to view:
   - CPU usage
   - Memory usage
   - Storage usage
   - Connections

### Connecting to Database for Management

You can connect to your database using any PostgreSQL client:

1. Get the External Connection String from your database dashboard
2. Use it with tools like:
   - psql command line
   - pgAdmin
   - DBeaver

Example using psql:
```bash
psql postgres://username:password@host:port/database_name
```

## Backup and Restore

### Automatic Backups

Render automatically takes daily snapshots of your database. These snapshots are retained for 30 days.

### Manual Backup

To create a manual backup:

```bash
pg_dump -h hostname -U username database_name > backup.sql
```

### Restore from Backup

To restore from a backup:

```bash
psql -h hostname -U username database_name < backup.sql
```

## Scaling Beyond Free Tier

If you outgrow the free tier, you can upgrade to a paid plan:

1. Go to your database dashboard
2. Click "Upgrade"
3. Select a plan that fits your needs

Paid plans offer:
- More storage and RAM
- Higher connection limits
- Point-in-time recovery
- Read replicas