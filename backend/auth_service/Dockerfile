FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get -y upgrade && apt-get -y install curl cron && apt-get clean

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY django/ .

# Expose the desired port
EXPOSE 8001

RUN echo '#!/bin/bash\n\
python manage.py crontab remove\n\
python manage.py crontab add\n\
service cron start\n\
python manage.py makemigrations\n\
python manage.py migrate\n\
gunicorn auth_service.wsgi:application --bind 0.0.0.0:8001 --workers=3\n\
' > /app/start.sh

RUN chmod +x /app/start.sh
