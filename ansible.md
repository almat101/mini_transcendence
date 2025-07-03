## 🚀 Ansible Deployment Automation

### ⚠️ Prerequisites

**This deployment automation requires a complete production environment:**

- **Server Infrastructure**: AWS EC2 instance with Ubuntu/Debian OS
- **Domain & SSL**: Valid domain name with DNS control(CLOUDFLARED)
- **Database Credentials**: PostgreSQL user/password for 3 databases
- **External Services**: Cloudflare tunnel token, SMTP email provider credentials(GMAIL)
- **Security Keys**: Django secret keys and JWT algorithms

**Important**: This is a production-ready deployment automation. All environment variables in the [`ansible/roles/app_config/templates/.env.j2`](ansible/roles/app_config/templates/.env.j2) template must be properly configured for the application to function.

### 🎯 What This Provides

- ✅ Complete infrastructure automation with Ansible
- ✅ Production-ready microservices deployment  
- ✅ Docker Compose orchestration with health checks
- ✅ SSL/TLS configuration and reverse proxy setup
- ⚠️ **Requires real infrastructure and credentials to run**

### 🔧 Quick Setup with Ansible

#### 1. Environment Setup
First, set up the Ansible environment using the automated script. You must modify the path of "ANSIBLE_PROJECT_DIR" if you do not clone the repository to $HOME/Desktop/:

```bash
cd ansible/
./ansible_venv.sh
```

The [`ansible_venv.sh`](ansible/ansible_venv.sh) script automatically:
- 🐍 Creates a Python virtual environment for Ansible
- 📦 Installs Ansible and required collections (`community.docker`)
- ✅ Validates the installation
- 📌 You must manually source the environment with: `source venv/bin/activate` to activate the virtual environment

#### 2. Configuration

**Step 1**: Configure your deployment settings:
```bash
# open the host.ini
vim inventory/hosts.ini 
# Edit with your ACTUAL server IP/hostname
ec2_instance ansible_host="YOUR EC2 public DNS hostname" ansible_user=ubuntu
# or ansible_user=admin if you use debian

# Configure Ansible settings
vim ansible.cfg
#edit this line
private_key_file="path of your EC2 PRIVATE KEY.pem"
```
**Important SSH Setup:**
- This deployment uses **SSH agent forwarding** (`-A` flag) which demonstrates advanced SSH capabilities.
- While originally implemented to clone environment files from private repositories, the project now uses Ansible Vault for secrets management instead.
- The configuration retains SSH agent forwarding as a showcase of this deployment capability, though it's no longer strictly required.
- The **SSH connection optimization** (`ControlMaster=auto` and `ControlPersist=60s`) improves performance when executing multiple tasks.
- You **must use the private key (.pem) file** provided by AWS when you created your EC2 instance.
- Ensure your key has proper permissions: `chmod 400 your-key.pem`
- Add your key to SSH agent: `ssh-add path/to/your-key.pem`

**To verify your SSH setup:**
```bash
# Check if your key is added to the agent
ssh-add -l

# Test connection to your EC2
ssh -i path/to/your-key.pem ubuntu@your-ec2-hostname.compute.amazonaws.com
```

**Note:** This dual approach to secrets management (SSH agent forwarding + Ansible Vault) demonstrates flexibility in DevOps practices. For public repositories or simplified deployments, the SSH agent forwarding can be disabled.


##### Quick Start create variable 
```bash
# Create variables file in the vault

# remove my secret variables
rm -rf vars/secret.yml

```
Create the vault with this command:

```yml
ansible-vault create vars/secrets.yml
```

and insert the password for your vault

Required variables in your vault:
```yml
# Database credentials
POSTGRES_USER: "your_db_username"
POSTGRES_PASSWORD: "your_secure_password_here"
POSTGRES_AUTH_DB: "auth_db"
POSTGRES_HISTORY_DB: "history_db"
POSTGRES_TOURNAMENT_DB: "tournament_db"
POSTGRES_AUTH_HOST: "auth_db"
POSTGRES_HISTORY_HOST: "history_db" 
POSTGRES_TOURNAMENT_HOST: "tournament_db"
POSTGRES_PORT: "5432"

# Django secret keys
SECRET_KEY: "your-django-secret-key"
SECRET_KEY_HISTORY: "your-history-secret-key"
SECRET_KEY_TOURNAMENT: "your-tournament-secret-key"

# JWT settings
JWT_ALGO: "HS256"

# Cloudflare settings
CLOUDFLARE_TUNNEL_TOKEN: "your-cloudflare-token"

# Email settings
ALERTMANAGER_EMAIL: "your-email@gmail.com"
ALERTMANAGER_PASSWORD: "your-app-specific-password"
```

You can edit the vault if you want to change some value:

```yaml
ansible-vault edit vars/secrets.yml
```

#### Deploy the Project

```bash
ansible-playbook -i inventory/hosts.ini playbooks/site.yml --ask-vault-pass
```

### 📁 Ansible Architecture

#### 🎯 Roles Overview

This Ansible deployment is organized into specialized roles, each handling specific aspects of the infrastructure:

##### 🔧 [`base_setup`](ansible/roles/base_setup/)
- System updates with apt cache refresh
- Docker installation and configuration:
  - Installs prerequisites and GPG keys
  - Configures Docker repositories
  - Installs Docker Engine, CLI, Containerd, and Compose Plugin
- User management:
  - Creates application owner user if needed
  - Adds users to Docker group for non-root access
- Directory structure setup:
  - Creates application base directory
  - Sets proper ownership and permissions
- Service configuration:
  - Ensures Docker service is running and enabled
  - Configures system for Docker operations

##### 📝 [`app_config`](ansible/roles/app_config/)
- Environment configuration:
  - Deploys `.env` file from Jinja2 template
  - Populates environment variables from vault secrets
  - Sets secure permissions (0600) for sensitive files
- Secure credential management:
  - Handles database connection parameters
  - Manages API keys and service tokens
  - Stores Django secret keys and JWT settings
- Integration with external services:
  - Configures Cloudflare tunnel settings
  - Sets up email/SMTP provider credentials
- Owner and permission management:
  - Ensures proper file ownership for the application user
  - Triggers service restarts when configuration changes

##### 📦 [`app_code`](ansible/roles/app_code/)
- Source code management:
  - Clones application code from GitHub repository
  - Updates existing codebase with latest changes via git pull
  - Manages specific branch deployment (configurable)
  - Handles force updates when needed
- Version control:
  - Tracks deployment status and changes
  - Provides feedback on deployment state (updated vs. already current)
- Permission handling:
  - Ensures code is owned by application user
  - Maintains proper access rights for the codebase

##### 🐳 [`docker_app`](ansible/roles/docker_app/)
- Docker environment validation:
  - Ensures Docker Compose is available and working
  - Performs sanity check before deployment
- Container lifecycle management:
  - Stops and removes existing containers cleanly
  - Builds container images with latest code changes
  - Starts all services defined in docker-compose.yml
  - Manages service dependencies and startup order
- Deployment orchestration:
  - Forces image rebuilds for consistency
  - Handles deployment state tracking
  - Provides status feedback on deployment
- User context management:
  - Runs Docker commands as application owner
  - Ensures proper permissions for Docker operations

#### Troubleshooting

- For detailed logs and debugging, run with verbose mode:
```bash
ansible-playbook -i inventory/hosts.ini playbooks/site.yml -vvv
```
- **Connection Issues**: Verify SSH keys and firewall settings
- **Permission Errors**: Check that the ansible.cfg has proper become settings
- **Vault Access**: Ensure vault password is correct with `--ask-vault-pass`
- **Docker Failures**: Inspect container logs with `docker compose logs`


### 📚 Additional Notes

> **🎯 Purpose**: This Ansible automation showcases infrastructure-as-code practices and microservices deployment. The automation demonstrates real-world production deployment patterns but requires actual infrastructure and credentials for a functional application.
