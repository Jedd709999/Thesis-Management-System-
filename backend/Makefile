.PHONY: help test test-auth test-docs test-schedules test-all lint format clean migrate seed run build

# Default target
help:
	@echo "Available commands:"
	@echo "  test         - Run all tests"
	@echo "  test-auth    - Run authentication tests only"
	@echo "  test-docs    - Run document upload tests only"
	@echo "  test-schedules - Run schedule creation tests only"
	@echo "  test-all     - Run tests with coverage"
	@echo "  lint         - Run code linting"
	@echo "  format       - Format code"
	@echo "  clean        - Clean up temporary files"
	@echo "  migrate      - Run database migrations"
	@echo "  seed         - Seed test data"
	@echo "  run          - Run development server"
	@echo "  build        - Build Docker containers"

# Test commands
test:
	pytest -v

test-auth:
	pytest tests/test_auth.py -v

test-docs:
	pytest tests/test_documents.py -v

test-schedules:
	pytest tests/test_schedules.py -v

test-all:
	pytest --cov=api --cov-report=html --cov-report=term-missing -v

# Code quality
lint:
	flake8 backend/
	bandit -r backend/backend/
	mypy backend/backend/

format:
	black backend/
	isort backend/

# Database operations
migrate:
	python manage.py migrate

seed:
	python manage.py seed_data --verbose

reset-db:
	python manage.py flush --noinput
	$(MAKE) migrate
	$(MAKE) seed

# Development
run:
	python manage.py runserver

daphne:
	daphne -b 127.0.0.1 -p 8000 backend.asgi:application

shell:
	python manage.py shell

# Docker commands
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

# Cleanup
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .coverage htmlcov/

# Coverage
coverage:
	pytest --cov=api --cov-report=html
	@echo "Coverage report generated in htmlcov/"

# Security
security:
	bandit -r backend/backend/ -f json -o security-report.json
	safety check

# CI simulation
ci-test:
	$(MAKE) clean
	$(MAKE) test-all
	$(MAKE) lint
	$(MAKE) security
