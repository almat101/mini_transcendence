# Trivy Security Scanning Guide

## What is Trivy?

Trivy is a simple and comprehensive vulnerability scanner for containers and other artifacts. It detects vulnerabilities in:

- **Container Images**: Scans Docker images for known vulnerabilities in installed packages and dependencies
- **Filesystems**: Scans configuration files (like Dockerfiles) for misconfigurations and security issues
- **Git repositories**: Detects secrets and vulnerabilities in source code
- **Application dependencies**: Identifies vulnerable dependencies in your code

Trivy is produced by Aqua Security and is widely used in CI/CD pipelines to ensure security before deploying containers.

### Key Features:
- Fast and lightweight scanning
- Supports multiple image formats (Docker, OCI, container registries)
- Detects vulnerabilities, misconfigurations, and secrets
- Integrates easily into CI/CD workflows
- Provides detailed severity reports (CRITICAL, HIGH, MEDIUM, LOW)

---

## Scanning Dockerfiles (Config Scanning)

Config scanning analyzes your Dockerfile for misconfigurations, best practice violations, and potential security issues **without building the image**.

### Basic Command

```bash
trivy config <path-to-dockerfile>
```

### Example: Scanning a Single Dockerfile

```bash
# Scan the auth service Dockerfile
trivy config backend/auth_service/Dockerfile

# Scan the history service Dockerfile
trivy config backend/history/Dockerfile

# Scan the tournament service Dockerfile
trivy config backend/tournament-service/Dockerfile
```

### Scan All Dockerfiles in Project

```bash
# Scan all Dockerfiles in the project
trivy config . --skip-dirs=node_modules,venv

# Or scan a specific directory
trivy config ./backend
trivy config ./proxy
trivy config ./ELK
```

### Output Formats for Config Scanning

```bash
# Table format (default)
trivy config backend/auth_service/Dockerfile

# JSON format
trivy config backend/auth_service/Dockerfile -f json -o report.json

# SARIF format (for GitHub, GitLab, etc.)
trivy config backend/auth_service/Dockerfile -f sarif -o report.sarif

# Template format
trivy config backend/auth_service/Dockerfile -f template --template '@contrib/html.tpl' -o report.html
```

### Common Config Issues Found

Trivy will report issues like:
- Base images with known vulnerabilities
- Running containers as root
- Missing health checks
- Using latest tags instead of specific versions
- Unencrypted secrets in Dockerfile
- Missing security labels

---

## Scanning Docker Images (Image Scanning)

Image scanning analyzes the **built Docker image** for known vulnerabilities in installed packages and dependencies. This requires building the image first.

### Step 1: Build the Docker Image

```bash
# Build the auth service image
docker build -t auth-service_trivy backend/auth_service/

# Build the history service image
docker build -t history-service_trivy backend/history/

# Build the tournament service image
docker build -t tournament-service_trivy backend/tournament-service/

# Build the proxy image
docker build -t proxy_trivy proxy/

```

### Step 2: Scan the Docker Image

```bash
# Basic image scan
trivy image auth-service_trivy

# With detailed output
trivy image auth-service_trivy --severity CRITICAL,HIGH

# JSON output
trivy image auth-service_trivy -f json -o image-report.json

# Show only vulnerabilities (exclude unfixed/errors)
trivy image auth-service_trivy --show-suppressed
```

### Full Workflow: Build and Scan

```bash
# Example: Auth service
docker build -t auth-service_trivy backend/auth_service/ && \
trivy image auth-service_trivy

# Example: History service with JSON output
docker build -t history-service_trivy backend/history/ && \
trivy image history-service_trivy -f json -o history-report.json

# Example: Tournament service with severity filter
docker build -t tournament-service_trivy backend/tournament-service/ && \
trivy image tournament-service_trivy --severity CRITICAL,HIGH
```

### Scanning from Registry

If the image is already in a Docker registry, you can scan it directly without building:

```bash
# Scan image from Docker Hub
trivy image ubuntu:22.04

# Scan image from private registry
trivy image registry.example.com/my-image:v1.0
```

---

## Severity Levels

Trivy reports vulnerabilities with the following severity levels:

| Level | Priority | Description |
|-------|----------|-------------|
| **CRITICAL** | Urgent | Highest impact vulnerabilities, immediate action required |
| **HIGH** | Important | Significant vulnerabilities that should be addressed soon |
| **MEDIUM** | Consider | Moderate vulnerabilities, should be reviewed and patched |
| **LOW** | Monitor | Lower impact vulnerabilities, monitor for updates |
| **UNKNOWN** | Information | Vulnerabilities with unconfirmed or unknown severity |

---

## Useful Trivy Options

### Filter by Severity

```bash
# Only show CRITICAL and HIGH vulnerabilities
trivy image myimage:latest --severity CRITICAL,HIGH

# Only show CRITICAL
trivy image myimage:latest --severity CRITICAL
```

### Ignore Specific Vulnerabilities

```bash
# Skip specific CVE IDs
trivy image myimage:latest --skip-cves CVE-2021-12345,CVE-2021-54321
```

### Output Formats

```bash
# JSON
trivy image myimage:latest -f json

# SARIF (for CI/CD integration)
trivy image myimage:latest -f sarif

# Cyclone DX (SBOM)
trivy image myimage:latest -f cyclonedx

# Table (default)
trivy image myimage:latest -f table
```

### Cache Management

```bash
# Clear cache
trivy image --clear-cache

# Update database
trivy image --download-db-only
```

---

## CI/CD Integration Examples

### GitHub Actions

```yaml
name: Trivy Scan
on: [push]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Scan Dockerfiles
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'config'
          scan-ref: '.'
      
      - name: Build and Scan Image
        run: |
          docker build -t myapp:latest .
          trivy image myapp:latest --format sarif --output trivy-results.sarif
      
      - name: Upload SARIF report
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

### Docker Compose + Trivy

```bash
# Build all services and scan them
docker-compose build && \
trivy image $(docker-compose config --services | xargs -I {} docker-compose images | grep -oP '.*?(?=\s)' | tail -n +2)
```

---

## Best Practices

1. **Scan Early and Often**: Scan Dockerfiles during development and images before deployment
2. **Fix CRITICAL and HIGH**: Address critical and high-severity vulnerabilities immediately
3. **Use Specific Base Image Versions**: Avoid `latest` tags; use specific versions
4. **Regular Updates**: Keep your base images and dependencies up to date
5. **Integrate into CI/CD**: Run Trivy scans in your pipeline to catch issues early
6. **Review Unfixed**: Some vulnerabilities may not have patches; document and monitor these
7. **Combine Scanning Types**: Use both config scanning (Dockerfiles) and image scanning (built images)

---

## Quick Reference

```bash
# Scan Dockerfile for misconfigurations
trivy config <path-to-dockerfile>

# Build image
docker build -t myapp_trivy .

# Scan built image for vulnerabilities
trivy image myapp_trivy

# Scan with severity filter
trivy image myapp_trivy --severity CRITICAL,HIGH

# Export as JSON
trivy image myapp_trivy -f json -o report.json

# Clear cache
trivy image --clear-cache
```

