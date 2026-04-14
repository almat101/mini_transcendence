# Audit Tecnico & Hardening - Istanza Hetzner Cloud

Questo documento riassume le attività di manutenzione, ottimizzazione e sicurezza effettuate sull'infrastruttura di test (Debian 13 su Hetzner Cloud).

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

### Verifica Log Post-Hardening (14 Aprile):
L'analisi dei log tramite journalctl conferma l'efficacia delle misure adottate:

- I tentativi di connessione da IP non autorizzati (es. 193.32.162.28) **falliscono** nella fase di banner exchange, impedendo qualsiasi tentativo di brute-force.

```txt
Apr 14 03:18:03 debian-4gb-nbg1-1 sshd-session[930078]: error: kex_exchange_identification: read: Connection reset by peer
Apr 14 03:18:03 debian-4gb-nbg1-1 sshd-session[930078]: Connection reset by 193.32.162.28 port 33350
Apr 14 03:18:03 debian-4gb-nbg1-1 sshd-session[930079]: banner exchange: Connection from 193.32.162.28 port 33380: invalid format
Apr 14 03:18:04 debian-4gb-nbg1-1 sshd-session[930117]: banner exchange: Connection from 193.32.162.28 port 33418: invalid format
```

>La differenza tra i due errori nel log:
>kex_exchange_identification: Il bot ha chiuso la connessione subito (Reset). È un "mordi e fuggi".
>banner exchange: invalid format: Il bot è rimasto connesso un secondo in più e ha provato a inviare dati "spazzatura" (magari cercando di capire se fosse un database o un server web). Il server ha letto quei dati, ha visto che non erano in formato SSH e ha dato l'errore di formato.

- L'accesso legittimo avviene esclusivamente tramite **chiave ED25519**, garantendo un livello di sicurezza superiore allo standard.

- Le routine di manutenzione (logrotate, apt-daily) procedono senza errori, confermando la stabilità del sistema dopo la pulizia del disco.

## 3. Automazione & Manutenzione (Ansible)
Le procedure di manutenzione sono state standardizzate nel workflow di deploy:
- Task di `docker system prune` inserito come step finale della pipeline.

## 4. Docker Daemon & Stabilità Applicativa
Per prevenire futuri esaurimenti di disco (Disk-Exhaustion), è stata implementata una policy di logging a livello di demone.

### Configurazione `daemon.json`:
Creato il file `/etc/docker/daemon.json` per limitare la crescita dei file di log JSON dei container:
- **max-size:** 10m
- **max-file:** 3
- **Vantaggio:** Ogni container è limitato a un massimo di 30MB di log rotativi.

## 5. CI/CD & Automazione (Ansible & GitHub)
Il workflow di Continuous Deployment è stato raffinato per integrare le modifiche di sicurezza.

### Gestione Secrets:
La porta SSH (2323) è stata rimossa dal codice sorgente e iniettata dinamicamente nel playbook Ansible tramite **GitHub Secrets**, garantendo la sicurezza delle credenziali e dei parametri d'accesso.

### Idempotenza e Immutabilità:
- **Problema:** I container esistenti non ereditano automaticamente le nuove regole sui log definite nel demone.
- **Soluzione:** Aggiornamento del modulo `community.docker.docker_compose_v2` con il parametro `recreate: always`.
- **Logica DevOps:** Sfruttato il concetto di immutabilità del container per forzare un re-deploy e assicurare l'allineamento di tutti i microservizi ai nuovi standard di storage.

## 5. Glossario
Termini chiave utilizzati:

- **Idempotenza:** Capacità di Ansible di eseguire un'azione solo se necessario (stato desiderato).
- **Hardening:** Rafforzamento della sicurezza tramite restrizione dei parametri (SSH, Firewall).
- **Inbound/Outbound Rules:** Gestione del traffico di rete perimetrale.
- **Dangling Images:** Layer Docker orfani e inutilizzati.
- **Log Rotation:** Gestione ciclica dei file di log per prevenire l'overflow del disco.

## 6. Skills Stack Dimostrate
- **Linux Admin:** Gestione Systemd (journald), troubleshooting avanzato del filesystem.
- **Networking & Security:** Cloud Firewalls, Hardening di OpenSSH, gestione Inbound traffic.
- **Docker:** Lifecycle management (images, layers, volumes).
- **Ansible:** Automazione della configurazione e dello stato desiderato (Maintenance-as-Code).

---
*Documentazione prodotta per l'audit tecnico personale - Aprile 2026*