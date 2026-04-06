# Security Scanning with Trivy

**Note:** The following Trivy scanning and hardening process was first applied to the NGINX (proxy) Dockerfile and image. The same approach will be extended to all other Dockerfiles and images in this project to ensure consistent security and compliance across the stack.

# Security Scanning with Trivy

This project uses [Trivy](https://github.com/aquasecurity/trivy) to scan Docker images for both misconfigurations and vulnerabilities.

## Misconfiguration Scan

- **First**, I ran Trivy to check for Dockerfile misconfigurations.
- **Findings:**
  - `USER root` was used (should use a non-root user)
  - Missing `HEALTHCHECK` in the Dockerfile (it was already used in docker-compose)
- **Actions taken:**
  - Added `USER nginx` to run the container as a non-root user
  - Moved the `HEALTHCHECK` instruction directly into the Dockerfile for better security and portability
- **Result:**

  ```
  ┌────────────┬────────────┬───────────────────┐
  │   Target   │    Type    │ Misconfigurations │
  ├────────────┼────────────┼───────────────────┤
  │ Dockerfile │ dockerfile │         0         │
  └────────────┴────────────┴───────────────────┘
  ```

  The Dockerfile now passes Trivy's misconfiguration checks with **0 issues**.

## Vulnerability & CVE Scan

- **Next**, I ran Trivy to scan for vulnerabilities (CVEs) in the image and its base OS (Alpine).
- **Result:**

  ```
  ┌──────────────────────────┬────────┬─────────────────┬─────────┐
  │          Target          │  Type  │ Vulnerabilities │ Secrets │
  ├──────────────────────────┼────────┼─────────────────┼─────────┤
  │ ng-trivy (alpine 3.23.3) │ alpine │        0        │    -    │
  └──────────────────────────┴────────┴─────────────────┴─────────┘
  ```

  The image is free of known vulnerabilities at scan time.

## Summary

- All Dockerfile best practices are followed (non-root user, healthcheck in Dockerfile)
- No misconfigurations or vulnerabilities detected by Trivy
- The image is safe and portable for production use
