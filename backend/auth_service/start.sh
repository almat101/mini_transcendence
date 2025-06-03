#!/bin/sh
python manage.py crontab remove
python manage.py crontab add
#python manage.py makemigrations
python manage.py migrate
gunicorn auth_service.wsgi:application --bind 0.0.0.0:8001 --workers=3
