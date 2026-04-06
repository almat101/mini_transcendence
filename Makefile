# =============================
# Local Development: Migrations
# =============================
#
# IMPORTANT: Before running the app locally, you MUST apply database migrations!
#
# Run:
#     make migrate-dev-run-all
#
# This will:
#   - Create new migration files for any model changes
#   - Apply all migrations to your local development databases
#
# Why is this important?
#   - If you do NOT run migrations, your Django apps will fail to start or respond with HTTP 500 errors
#     ("Internal Server Error") because the database schema will not match your models.
#   - Always run migrations after pulling new code, switching branches, or changing models.
#
# Typical workflow:
#   1. make dev-up
#   2. make migrate-dev-run-all
#   3. Access your app at http://localhost:8080
#
# If you see 500 errors on API endpoints, check your logs and make sure migrations have been applied!

all : up

up :
	docker compose -f docker-compose.yml up --build -d

down :
	docker compose -f docker-compose.yml down

start :
	docker compose -f docker-compose.yml start

stop :
	docker compose -f docker-compose.yml stop

clean :
	docker compose -f docker-compose.yml down -v

fclean:
	docker compose -f docker-compose.yml down -v --rmi all --remove-orphans

re: down up

prune :
	docker system prune -af --volumes

ps :
	docker compose -f docker-compose.yml ps --all

images :
	docker compose -f docker-compose.yml images

exec :
	docker exec -it $(C) /bin/bash || true

list-all :
	docker ps -a

list-all-id :
	docker ps -a -q

dev-up:
	docker compose -f docker-compose.dev.yml up --build -d

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-clean:
	docker compose -f docker-compose.dev.yml down -v

# DEV one-off migrations
migrate-dev-run-auth:
	docker compose -f docker-compose.dev.yml run --rm auth-service python manage.py makemigrations
	docker compose -f docker-compose.dev.yml run --rm auth-service python manage.py migrate

migrate-dev-run-tournament:
	docker compose -f docker-compose.dev.yml run --rm tournament-service python manage.py makemigrations
	docker compose -f docker-compose.dev.yml run --rm tournament-service python manage.py migrate

migrate-dev-run-history:
	docker compose -f docker-compose.dev.yml run --rm history-service python manage.py makemigrations
	docker compose -f docker-compose.dev.yml run --rm history-service python manage.py migrate

migrate-dev-run-all: migrate-dev-run-auth migrate-dev-run-tournament migrate-dev-run-history

.PHONY: all up down start stop clean fclean re prune ps images exec list-all list-all-id dev-up dev-down dev-clean
