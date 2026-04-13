# Audit Tecnico & Hardening - Istanza Hetzner Cloud

Questo documento riassume le attività di manutenzione, ottimizzazione e sicurezza effettuate sull'infrastruttura di test (Debian 12 su Hetzner Cloud).

## 1. Analisi e Ottimizzazione Storage
È stata rilevata una saturazione del disco (61%) dovuta all'accumulo di layer Docker e log di sistema.

### Interventi effettuati:
- **Diagnostica:** Utilizzo di `df -h`, `sudo ncdu /` e `docker system df`.
- **Docker Cleanup:** - Eseguito `docker system prune -af` manuale per il recupero immediato di circa 5GB di immagini e layer orfani.
    - Implementato un **Playbook Ansible** per eseguire regolarmente `docker system prune` (standard) per mantenere l'ambiente pulito post-deploy.
- **Log Management:** Identificazione di 3.7GB di log accumulati in `/var/log/journal`.
- **Retention Policy:** Implementazione di `journalctl --vacuum-size=500M` per forzare la rotazione e limitare l'ingombro dei log binari.

#### Analisi Vacuum Log:
**Stato Pre-intervento:**
```sh
journalctl --disk-usage
Archived and active journals take up 3.7G in the file system.
```

**Esecuzione:**
```sh
journalctl --vacuum-size=500M
Vacuuming done, freed 3.2G of archived journals from /var/log/journal/...
```

**Stato Post-intervento:**
```sh
root@debian-4gb-nbg1-1:~# journalctl --disk-usage
Archived and active journals take up 472.3M in the file system.

root@debian-4gb-nbg1-1:~# sudo du -sh /var/log/journal
481M    /var/log/journal
```

## 2. Security Hardening (SSH)
L'analisi dei log ha evidenziato un'attività critica di brute-force sulla porta standard.

### Diagnostica Attacchi (Journalctl):
```txt
Apr 13 00:00:03 sshd-session[3170010]: Failed password for root from 45.148.10.152 port 28796 ssh2
Apr 13 00:00:35 sshd-session[3170811]: Invalid user solana from 92.118.39.62 port 48284
Apr 13 00:00:53 sshd-session[3171184]: Invalid user solana from 80.94.92.183 port 38628
```

### Soluzione e Hardening applicato:
Per mitigare la superficie d'attacco, ho agito sulla configurazione del demone SSH (`sudo vim /etc/ssh/sshd_config`) e sul firewall perimetrale:

- **Port Swapping:** Migrazione del servizio dalla porta standard 22 alla porta **2323**.
- **Identity Enforcement:** Disabilitata l'autenticazione via password (`PasswordAuthentication no`).
- **SSH Keys:** Accesso consentito esclusivamente tramite chiavi asimmetriche (ED25519).
- **Network Layer (Cloud Firewall):** Similmente alla gestione dei **Security Groups su AWS**, ho aggiornato le **Inbound Rules** per permettere il traffico TCP sulla porta **2323** dal Public Internet, rimuovendo contestualmente la porta 22 per eliminare il rumore dei bot.

## 3. Automazione & Manutenzione (Ansible)
Le procedure di manutenzione sono state standardizzate nel workflow di deploy:
- Task di `docker system prune` inserito come step finale della pipeline.
- Configurazione del log-driver nel demone Docker per prevenire la crescita incontrollata dei file JSON.

## 4. Skills Stack Dimostrate
- **Linux Admin:** Gestione Systemd (journald), troubleshooting avanzato del filesystem.
- **Networking & Security:** Cloud Firewalls, Hardening di OpenSSH, gestione Inbound traffic.
- **Docker:** Lifecycle management (images, layers, volumes).
- **Ansible:** Automazione della configurazione e dello stato desiderato (Maintenance-as-Code).

---
*Documentazione prodotta per l'audit tecnico personale - Aprile 2026*