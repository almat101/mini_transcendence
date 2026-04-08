FROM python:3.13-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# RUN apt-get update && apt-get -y upgrade && apt-get -y install curl && apt-get clean
RUN apk update && apk upgrade && apk add --no-cache curl
COPY requirements.txt requirements.txt

RUN adduser -D appuser

# RUN pip install --upgrade pip -r requirements.txt
RUN pip install --upgrade pip -r requirements.txt
# RUN rm -rf /root/.cache/pip

COPY . .

USER appuser

EXPOSE 8002

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:8002/watchman/ || exit 1