# Makefile for Thesis Management System Docker Operations

# Default target
.PHONY: help
help:
	@echo "Thesis Management System Docker Commands"
	@echo "======================================"
	@echo "dev-up        - Start development environment"
	@echo "dev-down      - Stop development environment"
	@echo "dev-logs      - View development logs"
	@echo "prod-up       - Start production environment"
	@echo "prod-down     - Stop production environment"
	@echo "build         - Build all images"
	@echo "clean         - Remove containers and volumes"
	@echo "shell-backend - Open backend shell"
	@echo "shell-db      - Open database shell"
	@echo "migrate       - Run database migrations"
	@echo "collectstatic - Collect static files"
	@echo "superuser     - Create superuser"

# Development environment
.PHONY: dev-up
dev-up:
	docker-compose up --build

.PHONY: dev-down
dev-down:
	docker-compose down

.PHONY: dev-down-v
dev-down-v:
	docker-compose down -v

.PHONY: dev-logs
dev-logs:
	docker-compose logs -f

# Production environment
.PHONY: prod-up
prod-up:
	docker-compose -f docker-compose.prod.yml up --build

.PHONY: prod-down
prod-down:
	docker-compose -f docker-compose.prod.yml down

.PHONY: prod-down-v
prod-down-v:
	docker-compose -f docker-compose.prod.yml down -v

# Build operations
.PHONY: build
build:
	docker-compose build

.PHONY: build-no-cache
build-no-cache:
	docker-compose build --no-cache

# Cleanup
.PHONY: clean
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Shell access
.PHONY: shell-backend
shell-backend:
	docker-compose exec backend sh

.PHONY: shell-db
shell-db:
	docker-compose exec db mysql -u thesis_user -pthesis_pass thesis_db

# Django management commands
.PHONY: migrate
migrate:
	docker-compose exec backend python manage.py migrate

.PHONY: collectstatic
collectstatic:
	docker-compose exec backend python manage.py collectstatic --noinput

.PHONY: superuser
superuser:
	docker-compose exec backend python manage.py createsuperuser

.PHONY: shell-django
shell-django:
	docker-compose exec backend python manage.py shell

# Testing
.PHONY: test
test:
	docker-compose exec backend python manage.py test

.PHONY: test-coverage
test-coverage:
	docker-compose exec backend coverage run --source='.' manage.py test

# Database operations
.PHONY: db-backup
db-backup:
	docker-compose exec db mysqldump -u thesis_user -pthesis_pass thesis_db > backup.sql

.PHONY: db-restore
db-restore:
	docker-compose exec db mysql -u thesis_user -pthesis_pass thesis_db < backup.sql