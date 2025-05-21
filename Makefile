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

.PHONY: all up down start stop clean fclean re prune ps images exec list-all list-all-id
