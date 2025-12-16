# Docker Setup for Thesis Management System

This document explains how to containerize and run the Thesis Management System using Docker.

## Two Ways to Run with Docker

1. **Using Docker Compose (Recommended)**: Runs all services (database, backend, frontend) together
2. **Using Root Dockerfile**: Builds and runs just the backend service

For most development and production scenarios, we recommend using Docker Compose as it handles all services and their dependencies.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose 1.29 or higher

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. Clone the repository (if not already done)
2. Navigate to the project root directory
3. Run the application:
   ```bash
   docker-compose up --build
   ```

### Option 2: Using Root Dockerfile (Backend Only)

1. Clone the repository (if not already done)
2. Navigate to the project root directory
3. Build the image:
   ```bash
   docker build -t thesis-backend .
   ```
4. Run the container:
   ```bash
   docker run -p 8000:8000 thesis-backend
   ```

Note: When using the root Dockerfile, you'll need to separately manage the database and other services.

## Services Overview

The application consists of four main services:

1. **db** - MySQL 8.0 database
2. **backend** - Django REST API application
3. **frontend** - React/Vite frontend served by Nginx
4. **nginx** (production only) - Reverse proxy and load balancer

## Development Setup

### Starting the Application

```bash
docker-compose up --build
```

This will:
- Build the backend and frontend images
- Start all services
- Apply database migrations
- Create a default superuser (admin/admin)
- Collect static files

### Stopping the Application

```bash
docker-compose down
```

To stop and remove volumes (including database data):

```bash
docker-compose down -v
```

### Accessing Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/
- Database: mysql://localhost:3307

## Production Setup

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
DB_PASSWORD=secure_password
DB_ROOT_PASSWORD=secure_root_password
DJANGO_SECRET_KEY=your_secret_key_here
DEBUG=False

# Email settings (optional)
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@example.com
EMAIL_HOST_PASSWORD=your_email_password
DEFAULT_FROM_EMAIL=noreply@your-domain.com

# Google OAuth settings (optional)
GOOGLE_OAUTH2_CLIENT_ID=your_client_id
GOOGLE_OAUTH2_CLIENT_SECRET=your_client_secret
```

### Starting the Application

```bash
docker-compose -f docker-compose.prod.yml up --build
```

## Customization

### Database Configuration

The database is configured with:
- Database name: `thesis_db`
- Username: `thesis_user`
- Password: `thesis_pass` (development) or from `DB_PASSWORD` (production)

### Backend Configuration

The backend service uses several environment variables:
- `DATABASE_HOST`: Database host (default: db)
- `DATABASE_NAME`: Database name (default: thesis_db)
- `DATABASE_USER`: Database user (default: thesis_user)
- `DATABASE_PASSWORD`: Database password
- `DJANGO_SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (default: False)

### Frontend Configuration

The frontend is built as a static site and served by Nginx. The Nginx configuration proxies API requests to the backend service.

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3000, 8000, or 3307 are already in use, modify the `ports` section in `docker-compose.yml`.

2. **Database connection errors**: Ensure the database service is healthy before the backend starts. The entrypoint script includes a wait mechanism.

3. **Permission denied errors**: On Linux, you may need to adjust file permissions for the entrypoint script:
   ```bash
   chmod +x backend/entrypoint.sh
   ```

### Viewing Logs

```bash
docker-compose logs [service_name]
```

For continuous log streaming:
```bash
docker-compose logs -f [service_name]
```

### Running Management Commands

To run Django management commands:

```bash
docker-compose exec backend python manage.py [command]
```

Examples:
```bash
# Create a superuser
docker-compose exec backend python manage.py createsuperuser

# Run migrations
docker-compose exec backend python manage.py migrate

# Collect static files
docker-compose exec backend python manage.py collectstatic
```

## Volume Management

The setup uses named volumes for persistent data:
- `db_data`: Database files
- `staticfiles`: Django static files
- `mediafiles`: User-uploaded media files

To backup volumes:
```bash
docker run --rm -v thesismanagement_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db_backup.tar.gz -C /data .
```

## Health Checks

All services include health checks:
- **db**: MySQL ping
- **backend**: HTTP request to `/api/`
- **frontend**: Service startup

Health checks ensure services are ready before dependent services start.

## Security Considerations

1. Change default passwords in production
2. Use strong secret keys
3. Enable HTTPS in production
4. Regularly update base images
5. Don't expose the database port publicly in production

## Updating the Application

1. Pull the latest code
2. Rebuild and restart services:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

For production:
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build
```