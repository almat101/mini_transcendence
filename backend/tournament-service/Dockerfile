FROM python:3.13-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apk update && apk upgrade && apk add --no-cache curl

COPY requirements.txt requirements.txt

RUN adduser -D appuser

# upgrade pip solve cve CVE-2026-3219
#https://app.opencve.io/cve/CVE-2026-3219
RUN pip install --upgrade pip -r requirements.txt

COPY . .

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8003

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:8003/watchman/ || exit 1