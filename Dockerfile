# Root Dockerfile for the Thesis Management System Backend
# This file builds the backend service directly
# For the full application with all services, use docker-compose instead
# This Dockerfile supports both docker-compose and standalone usage

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Updated to include both /app and /app/backend
ENV PYTHONPATH=/app:/app/backend
ENV DJANGO_SETTINGS_MODULE=backend.settings

# Upgrade pip first
RUN pip install --upgrade pip

# Install Python dependencies
COPY ./backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend project
COPY ./backend .

# Copy entrypoint scripts
COPY ./backend/entrypoint.sh ./entrypoint-compose.sh
COPY ./entrypoint-standalone.sh ./entrypoint.sh

# Make entrypoint scripts executable
RUN chmod +x /app/entrypoint.sh /app/entrypoint-compose.sh

# Run the application
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "asgi:application"]