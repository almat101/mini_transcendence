# Docker Bind Mount Permissions Error: Local vs Production

## Error Description

When running the `history-service` container as a non-root user (`appuser`), the following error occurred in production/CI:

```
PermissionError: [Errno 13] Permission denied: '/app/django-watchman-<uuid>.txt'
```

- The Django Watchman storage check failed because the application could not write to `/app`.
- The error did **not** occur locally during development.

## Cause

- **Locally**, the service was started with a bind mount:
  ```yaml
    volumes:
      - ./backend/history:/app:rw
  ```
  This means `/app` inside the container is mapped to your local filesystem. File permissions and ownership are inherited from your host system, often allowing the container user (`appuser`) to write to `/app` even if it is not explicitly owned by `appuser` inside the image.

- **In production/CI**, there is **no bind mount**. The `/app` directory and its files are owned by `root` (from the Docker build process). When the container switches to `USER appuser`, this user does **not** have write permissions to `/app`, causing permission errors.

## Why the Error Only Happens in Production/CI
- **Bind mounts** in local development mask permission issues because the host's user and group IDs may match or be more permissive.
- **In production**, the container filesystem is isolated, and file ownership defaults to `root` unless changed in the Dockerfile. Non-root users cannot write to directories owned by root.
- As a result, the container fails health checks and is marked as unhealthy in CI/CD, but appears healthy locally.

## Solution

**Explicitly set directory ownership in the Dockerfile after copying files:**

```dockerfile
COPY . .
RUN chown -R appuser:appuser /app
USER appuser
```

This ensures `appuser` can write to `/app` in all environments, regardless of bind mounts or build context.

## Summary
- Always set correct ownership for writable directories in the Dockerfile when using non-root users.
- Do not rely on local bind mounts to test permissions—test with the same setup as production.
- This prevents permission errors and ensures consistent, healthy containers in CI/CD and production.
