.PHONY: install ruff test ftest revision upgrade downgrade migration-history compose-up compose-down network build-up logs

install:
	poetry install

# Docker Compose создаёт сеть проекта сама; опционально можно создать внешнюю сеть (ошибка «уже есть» игнорируется).
network:
	-docker network create vibe-chat-network

compose-up:
	docker compose up --build

# Сборка и запуск (порт приложения: 8001). Логи в текущем терминале; для фона: docker compose up --build -d
build-up:
	docker compose up --build

compose-down:
	docker compose down

logs:
	docker compose logs -f

ruff:
	poetry run ruff format .
	poetry run ruff check . --fix

test:
	poetry run python -m pytest -svv $(target)

ftest:
	poetry run python -m pytest -x -n 2 --dist loadfile

test-integration:
	poetry run python -m pytest -m "integration" -svv

revision:
	poetry run alembic revision --autogenerate -m "$(m)"

upgrade:
	poetry run alembic upgrade head

downgrade:
	poetry run alembic downgrade -$(last)

migration-history:
	poetry run alembic history
