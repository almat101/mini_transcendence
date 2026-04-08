# Security Scanning with Trivy

**Note:** The following Trivy scanning and hardening process was first applied to the NGINX (proxy) Dockerfile and image. The same approach will be extended to all other Dockerfiles and images in this project to ensure consistent security and compliance across the stack.

# Security Scanning with Trivy

This project uses [Trivy](https://github.com/aquasecurity/trivy) to scan Docker images for both misconfigurations and vulnerabilities.

## Misconfiguration Scan ( PROXY aka nginx)

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

## Image scan for Vulnerability & CVE (PROXY image)

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

## Misconfiguration Scan ( history service django)

**Fouded and solved the same errors on history Dockerfile:**
```
Dockerfile (dockerfile)

Tests: 27 (SUCCESSES: 25, FAILURES: 2)
Failures: 2 (UNKNOWN: 0, LOW: 1, MEDIUM: 0, HIGH: 1, CRITICAL: 0)

DS-0002 (HIGH): Specify at least 1 USER command in Dockerfile with non-root user as argument
═══════════════════════════════════════════════════════════════════════════════════════════════
Running containers with 'root' user can lead to a container escape situation. It is a best practice to run containers as non-root users, which can be done by adding a 'USER' statement to the Dockerfile.

See https://avd.aquasec.com/misconfig/ds-0002
───────────────────────────────────────────────────────────────────────────────────────────────


DS-0026 (LOW): Add HEALTHCHECK instruction in your Dockerfile
═══════════════════════════════════════════════════════════════════════════════════════════════
You should add HEALTHCHECK instruction in your docker container images to perform the health check on running containers.

See https://avd.aquasec.com/misconfig/ds-0026
```

Solved creating and using appuser into dockerfile:

```Dockerfile
RUN adduser -d appuser
...
USER appuser
```

Moved `HEALTHCHECK` from docker-compose to history's Dockerfile.

```Dockerfile
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:8002/watchman/ || exit 1
```


## Image scan for Vulnerability & CVE (history-service image)

**Founded this 2 minor vulnerability on histoty image**

```txt
Total: 2 (UNKNOWN: 0, LOW: 1, MEDIUM: 1, HIGH: 0, CRITICAL: 0)

┌──────────────────────────────────┬────────────────┬──────────┬────────┬───────────────────┬───────────────┬──────────────────────────────────────────────────────────┐
│             Library              │ Vulnerability  │ Severity │ Status │ Installed Version │ Fixed Version │                          Title                           │
├──────────────────────────────────┼────────────────┼──────────┼────────┼───────────────────┼───────────────┼──────────────────────────────────────────────────────────┤
│ django-rest-framework (METADATA) │ CVE-2018-25045 │ MEDIUM   │ fixed  │ 0.1.0             │ 3.9.1         │ Django REST framework (aka django-rest-framework) before │
│                                  │                │          │        │                   │               │ 3.9.1 allows ...                                         │
│                                  │                │          │        │                   │               │ https://avd.aquasec.com/nvd/cve-2018-25045               │
├──────────────────────────────────┼────────────────┼──────────┤        ├───────────────────┼───────────────┼──────────────────────────────────────────────────────────┤
│ pip (METADATA)                   │ CVE-2026-1703  │ LOW      │        │ 25.3              │ 26.0          │ pip: pip: Information disclosure via path traversal when │
│                                  │                │          │        │                   │               │ installing crafted wheel archives...                     │
│                                  │                │          │        │                   │               │ https://avd.aquasec.com/nvd/cve-2026-1703                │
└──────────────────────────────────┴────────────────┴──────────┴────────┴───────────────────┴───────────────┴──────────────────────────────────────────────────────────┘
```

**first vulnerability** solved by following the aquasec link and upgrading django-rest-framework to a version greater than djangorestframework>=3.9.1

**second vulnerability** solved by adding pip upgrade to update pip to version 26.0

```Dockerfile
RUN pip install --upgrade pip -r requirements.txt
```

**This third vulnerability was a false positive from a pip cache file, resolved by adding a trivyignore to skip that folder.**
```txt
/root/.cache/pip/http-v2/a/4/3/4/1/a43418dee01c0521b172b1ffdee39582e67f2bffc1af017bc17d1884.body (secrets)

Total: 1 (UNKNOWN: 0, LOW: 0, MEDIUM: 1, HIGH: 0, CRITICAL: 0)

MEDIUM: JWT (jwt-token)
═══════════════════════════════════════════════════════════════════════════════════════════════
JWT token
───────────────────────────────────────────────────────────────────────────────────────────────
 /root/.cache/pip/http-v2/a/4/3/4/1/a43418dee01c0521b172b1ffdee39582e67f2bffc1af017bc17d1884.body:91 (offset: 3688 bytes) (added by 'RUN /bin/sh -c pip install --upgrade pip')
───────────────────────────────────────────────────────────────────────────────────────────────
  89       >>> encoded = jwt.encode({"some": "payload"}, "secret", algorithm="HS256")
  90       >>> print(encoded)
  91 [     *********************************************************************************************************
  92       >>> jwt.decode(encoded, "secret", algorithms=["HS256"])
───────────────────────────────────────────────────────────────────────────────────────────────
```

