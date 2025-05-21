#!/bin/sh

python manage.py makemigrations
python manage.py migrate
gunicorn history_service.wsgi:application --bind 0.0.0.0:8002 --workers=3
      