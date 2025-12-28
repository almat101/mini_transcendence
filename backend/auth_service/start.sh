#!/bin/sh
set -e
python manage.py crontab remove
python manage.py crontab add
exec gunicorn auth_service.wsgi:application --bind 0.0.0.0:8001 --workers=1 --threads=4