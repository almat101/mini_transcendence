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

DEV_COMPOSE := docker-compose.dev.yml

dev-up:
	docker compose -f $(DEV_COMPOSE) up --build -d

dev-down:
	docker compose -f $(DEV_COMPOSE) down

dev-ps:
	docker compose -f $(DEV_COMPOSE) ps --all

dev-logs:
	docker compose -f $(DEV_COMPOSE) logs -f

# # generate migration files (dev only) — runs in a container that mounts source
makemigrations-auth:
	docker compose -f $(DEV_COMPOSE) run --rm auth-service python manage.py makemigrations

makemigrations-history:
	docker compose -f $(DEV_COMPOSE) run --rm history-service python manage.py makemigrations

makemigrations-tournament:
	docker compose -f $(DEV_COMPOSE) run --rm tournament-service python manage.py makemigrations

migrate-auth:
	docker compose -f $(DEV_COMPOSE) run --rm auth-service python manage.py migrate --noinput

migrate-history:
	docker compose -f $(DEV_COMPOSE) run --rm history-service python manage.py migrate --noinput

migrate-tournament:
	docker compose -f $(DEV_COMPOSE) run --rm tournament-service python manage.py migrate --noinput

migrate-all: migrate-auth migrate-history migrate-tournament

# build, run migrations, then start services (release step)
release:
	docker compose -f docker-compose.yml build
# run migrations from built images (single-run)
	docker compose -f docker-compose.yml run --rm auth-service python manage.py migrate --noinput
	docker compose -f docker-compose.yml run --rm history-service python manage.py migrate --noinput
	docker compose -f docker-compose.yml run --rm tournament-service python manage.py migrate --noinput

	docker compose -f docker-compose.yml up -d

.PHONY: all up down start stop clean fclean re prune ps images exec list-all list-all-id dev-up dev-down dev-ps dev-logs makemigrations-auth makemigrations-history makemigrations-tournament migrate-auth migrate-history migrate-tournament migrate-all release