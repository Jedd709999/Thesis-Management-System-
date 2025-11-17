# Development Setup Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git for cloning the repository

### Running the Application

1. **Start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: localhost:3307

### Test Users

The application automatically seeds test users on startup:

#### Admin Users
- **Email:** admin@test.com
- **Password:** admin123

- **Email:** admin2@test.com  
- **Password:** admin123

#### Adviser Users
- **Email:** adviser@test.com
- **Password:** adviser123

- **Email:** adviser2@test.com
- **Password:** adviser123

#### Student Users
- **Email:** student@test.com
- **Password:** student123

- **Email:** student2@test.com
- **Password:** student123

- **Email:** student3@test.com
- **Password:** student123

#### Panel Users
- **Email:** panel@test.com
- **Password:** panel123

- **Email:** panel2@test.com
- **Password:** panel123

## Development Commands

### Database Management
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Seed test data (manually)
docker-compose exec backend python manage.py seed_data --verbose

# Reset and reseed data
docker-compose exec backend python manage.py seed_data --reset --verbose

# Access Django shell
docker-compose exec backend python manage.py shell

# Access database shell
docker-compose exec backend python manage.py dbshell
```

### Application Management
```bash
# View logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Restart services
docker-compose restart backend

# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

## Development Workflow

### Making Changes
1. **Backend changes:** Edit files in `backend/` directory
2. **Frontend changes:** Edit files in `frontend/` directory
3. **Hot reload:** Both services support hot reload during development

### Database Changes
1. **Create migrations:**
   ```bash
   docker-compose exec backend python manage.py makemigrations
   ```

2. **Apply migrations:**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

3. **Update seed data:** Modify `backend/backend/backend/management/commands/seed_data.py`

### Testing JWT Refresh
1. Use the HTML test suite: `frontend/test-jwt-refresh.html`
2. Use the AuthDebug component in the React app
3. Monitor browser developer tools for network requests

## Environment Variables

### Backend Environment
- `DATABASE_HOST`: Database host (default: db:3306)
- `DATABASE_NAME`: Database name (default: thesis_db)
- `DATABASE_USER`: Database user (default: thesis_user)
- `DATABASE_PASSWORD`: Database password (default: thesis_pass)
- `DJANGO_SECRET_KEY`: Django secret key (default: changeme)

### Frontend Environment
- `VITE_API_URL`: Backend API URL (default: http://127.0.0.1:8000/api/)

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Ensure MySQL service is running
   - Check database credentials in environment variables
   - Wait for database to fully start before running migrations

2. **Port conflicts:**
   - Change ports in docker-compose.yml if needed
   - Ensure no other services are using ports 3000, 8000, 3307

3. **Permission errors:**
   - Ensure Docker has proper permissions
   - On Linux, you may need to add your user to docker group

4. **Build errors:**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild: `docker-compose build --no-cache`

### Reset Development Environment
```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove Docker images
docker system prune -a

# Rebuild and start
docker-compose up --build
```

## Production Considerations

- Change default passwords for production
- Use environment-specific configurations
- Set up proper SSL certificates
- Configure proper database backups
- Use secret management for sensitive data
