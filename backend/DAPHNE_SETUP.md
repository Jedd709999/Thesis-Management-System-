# Running the Thesis Management System with Daphne

This document explains how to run the backend of the Thesis Management System using Daphne, an ASGI server that supports both HTTP and WebSocket protocols.

## Prerequisites

1. Python 3.8 or higher
2. Virtual environment (recommended)
3. All dependencies installed via `pip install -r requirements.txt`

## Installation

Daphne is already included in the [requirements.txt](requirements.txt) file. To install it along with other dependencies:

```bash
pip install -r requirements.txt
```

## Running with Daphne

### Method 1: Direct Command

From the `backend` directory, run:

```bash
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

### Method 2: Using Makefile (Linux/Mac)

From the `backend` directory:

```bash
make daphne
```

### Method 3: Using PowerShell Script (Windows)

From the `backend` directory:

```powershell
.\run_daphne.ps1
```

### Method 4: Using Python Script

From the `backend` directory:

```bash
python run_daphne.py
```

### Method 5: Using Docker

To run with Docker Compose (which now uses Daphne):

```bash
docker-compose up
```

## Configuration Options

- `-b` or `--bind`: The host to bind to (default: 127.0.0.1)
- `-p` or `--port`: The port to listen on (default: 8000)
- Additional options can be found in the [Daphne documentation](https://github.com/django/daphne)

## Benefits of Using Daphne

1. **WebSocket Support**: Daphne natively supports WebSockets, which are used in this application for real-time notifications.
2. **ASGI Compliance**: Full compatibility with Django Channels.
3. **Production Ready**: Suitable for production deployments.
4. **Better Performance**: More efficient handling of concurrent connections.

## Troubleshooting

### Port Already in Use

If you get an error about the port being in use, either:

1. Stop the existing process:
   ```bash
   lsof -i :8000  # Linux/Mac
   # or
   netstat -ano | findstr :8000  # Windows
   ```

2. Or run Daphne on a different port:
   ```bash
   daphne -p 8001 backend.asgi:application
   ```

### ImportError

If you encounter import errors, make sure you're running the command from the `backend` directory (the one containing [manage.py](backend/manage.py)).

### Missing Dependencies

If you get errors about missing modules, ensure all dependencies are installed:

```bash
pip install -r requirements.txt
```