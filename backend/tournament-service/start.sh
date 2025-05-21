#!/bin/sh

python manage.py makemigrations
python manage.py migrate
gunicorn tournament.wsgi:application --bind 0.0.0.0:8003 --workers=3