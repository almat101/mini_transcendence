FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get -y upgrade && apt-get -y install curl && apt-get clean

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY . .

# Expose the desired port
EXPOSE 8003
