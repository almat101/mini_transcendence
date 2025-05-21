FROM python:3.13-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

#RUN apt-get update && apt-get -y upgrade && apt-get -y install curl && apt-get clean
RUN apk update && apk upgrade && apk add --no-cache curl

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY . .

RUN chmod +x /app/start.sh

# Expose the desired port
EXPOSE 8003
