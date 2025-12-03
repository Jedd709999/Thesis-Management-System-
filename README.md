# Thesis Management System

A comprehensive web application for managing academic thesis workflows, group collaborations, scheduling, and document sharing.

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## Overview

The Thesis Management System is designed to streamline the academic thesis process for students, advisers, and administrators. It facilitates group formation, topic proposal, scheduling, document management, and communication throughout the thesis lifecycle.

## Key Features

- **User Authentication & Authorization**: Secure login with role-based access control (RBAC)
- **Group Management**: Form groups, propose topics, assign leaders
- **Thesis Workflow**: Track thesis progress from proposal to completion
- **Document Management**: Upload and share documents with Google Drive integration
- **Scheduling**: Coordinate meetings and deadlines with conflict detection
- **Notifications**: Real-time notifications for important updates
- **Admin Panel**: Manage users, groups, and system settings

## Group Proposal Approval Workflow

Administrators can review and approve or reject student group proposals through a dedicated interface. For detailed information about this workflow, see [GROUP_PROPOSAL_APPROVAL.md](GROUP_PROPOSAL_APPROVAL.md).

## Technology Stack

### Backend
- **Python 3.x**
- **Django** with **Django REST Framework**
- **ASGI** for asynchronous operations
- **PostgreSQL** database
- **Daphne** for ASGI server
- **Google OAuth2** for authentication
- **PyMySQL** (on Windows environments)

### Frontend
- **React** with **TypeScript**
- **Vite** build tool
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **WebSocket** for real-time features

### Infrastructure
- **Docker** & **Docker Compose** for containerization
- **Nginx** as reverse proxy
- **Makefile** for common commands

## Project Structure

```
Thesis Management System/
├── backend/                 # Django backend application
│   ├── api/                # API endpoints and business logic
│   │   ├── models/         # Database models
│   │   ├── serializers/    # Data serialization
│   │   ├── views/          # API views
│   │   └── migrations/     # Database migrations
│   ├── backend/            # Django project settings
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend application
│   ├── src/                # Source code
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API service clients
│   │   └── context/        # React context providers
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite configuration
├── nginx/                  # Nginx configuration
├── docker-compose.yml      # Docker Compose configuration
└── Makefile               # Common development commands
```

## Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **Docker** & **Docker Compose** (recommended)
- **PostgreSQL** (if running without Docker)
- **Google OAuth2 Credentials** (for authentication)

## Setup Instructions

### Option 1: Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd "Thesis Management System"
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   # Update the values in .env as needed
   ```

3. Build and start the services:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin panel: http://localhost:8000/admin

### Option 2: Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure database:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Run the development server:
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Google Integration

The system supports two types of Google integration:

1. **Google OAuth for User Authentication**: Allows users to connect their personal Google accounts
2. **Google Drive for Document Storage**: Enables document storage in Google Drive

### Google OAuth Setup

To enable Google OAuth:

1. Follow the instructions in [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)
2. Configure the environment variables in both frontend and backend

### Google Drive Setup

For document storage in Google Drive, you have two options:

1. **Shared Drive Approach** (Recommended for production):
   - Requires Google Workspace
   - Follow instructions in [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md)
   - Set `GOOGLE_SHARED_DRIVE_ID` environment variable

2. **Personal Account Approach** (Easier setup):
   - Users connect their personal Google accounts
   - No special setup required beyond Google OAuth
   - Documents stored in user's personal Google Drive

If neither approach is configured, documents will be stored locally on the server.

## Development

### Common Commands

Using Makefile (from the project root):
```bash
make build              # Build Docker images
make up                 # Start services
make down               # Stop services
make logs               # View service logs
make migrate            # Run database migrations
make test               # Run tests
```

### Environment Variables

Create a `.env` file in the project root with the following variables:
```env
# Database
DB_NAME=thesis_db
DB_USER=thesis_user
DB_PASSWORD=secure_password
DB_HOST=db
DB_PORT=5432

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Drive (Optional - for Shared Drive integration)
GOOGLE_SHARED_DRIVE_ID=your_shared_drive_id

# Django
SECRET_KEY=your_django_secret_key
DEBUG=True
```

## Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## Deployment

1. Update environment variables in `.env` for production
2. Build the Docker images:
   ```bash
   docker-compose build
   ```
3. Start the services:
   ```bash
   docker-compose up -d
   ```

## API Documentation

API documentation is available through Django REST Framework's browsable API when running the development server:
- http://localhost:8000/api/

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.