#!/bin/bash

# Test Docker Setup Script

echo "Testing Thesis Management System Docker Setup"

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "Docker and Docker Compose are installed."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "docker-compose.yml not found. Please run this script from the project root directory."
    exit 1
fi

echo "docker-compose.yml found."

# Check if backend entrypoint.sh exists and is executable
if [ ! -f "backend/entrypoint.sh" ]; then
    echo "backend/entrypoint.sh not found."
    exit 1
fi

echo "backend/entrypoint.sh found."

# Make entrypoint.sh executable
chmod +x backend/entrypoint.sh
echo "Made backend/entrypoint.sh executable."

echo "Setup validation complete. You can now run:"
echo "  docker-compose up --build"
echo "to start the application."