# How to Run the Thesis Management System with Daphne

This document provides instructions on how to run the Thesis Management System backend using Daphne, an ASGI server that supports both HTTP and WebSocket protocols.

## What is Daphne?

Daphne is a pure-Python ASGI server maintained by the Django project. It's designed for running ASGI applications, particularly Django Channels applications, and provides excellent support for WebSockets.

## Why Use Daphne for This System?

The Thesis Management System uses Django Channels for real-time features like notifications, which require WebSocket support. While the development server (`python manage.py runserver`) can handle WebSockets, Daphne is the recommended production server for ASGI applications.

## Prerequisites

1. Python 3.8 or higher
2. All required packages installed (`pip install -r requirements.txt`)
3. Daphne (automatically installed with requirements)

## Running the System with Daphne

### Option 1: Direct Command Line

Navigate to the `backend` directory and run:

```bash
daphne -b 127.0.0.1 -p 8000 backend.asgi:application
```

### Option 2: Using the Provided Scripts

#### On Windows:
```powershell
cd backend
.\run_daphne.ps1
```

#### On Linux/Mac or using Python directly:
```bash
cd backend
python run_daphne.py
```

### Option 3: Using Make (Linux/Mac)
```bash
cd backend
make daphne
```

### Option 4: Using Docker
The system is configured to use Daphne in Docker containers:
```bash
docker-compose up
```

## Configuration Details

The system is configured with the following Daphne settings:

- Host: 0.0.0.0 (allows external connections)
- Port: 8000 (standard Django port)
- Application: backend.asgi:application (points to your ASGI config)

## Key Features Enabled by Daphne

1. **WebSocket Support**: Real-time notifications and collaborative features
2. **ASGI Compliance**: Full compatibility with Django Channels
3. **Concurrent Connections**: Better handling of multiple users
4. **Production Ready**: Suitable for deployment

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port with `-p` option
2. **Import errors**: Ensure you're in the backend directory
3. **Missing dependencies**: Run `pip install -r requirements.txt`

### Verifying Daphne Installation

To check if Daphne is properly installed:
```bash
daphne --help
```

## Additional Resources

- [Daphne Documentation](https://github.com/django/daphne)
- [Django Channels Documentation](https://channels.readthedocs.io/)
- [ASGI Specification](https://asgi.readthedocs.io/)

## Next Steps

After starting the server with Daphne, you can:
1. Access the admin panel at http://localhost:8000/admin/
2. Use the API endpoints as documented
3. Connect the frontend application to http://localhost:8000