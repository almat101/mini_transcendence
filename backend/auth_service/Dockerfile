FROM python:3.13-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

#RUN apt-get update && apt-get -y upgrade && apt-get -y install curl cron && apt-get clean
RUN apk update && apk upgrade && apk add --no-cache curl

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

EXPOSE 8001

COPY django/ .
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# RUN echo '#!/bin/sh\n\
# python manage.py crontab remove\n\
# python manage.py crontab add\n\
# python manage.py makemigrations\n\
# python manage.py migrate\n\
# gunicorn auth_service.wsgi:application --bind 0.0.0.0:8001 --workers=3\n\
# ' > /app/start.sh
