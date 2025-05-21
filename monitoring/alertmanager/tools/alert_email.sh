#!/bin/sh
 
# Ensure the SLACK_API_URL environment variable is set
if [ -z "$ALERTMANAGER_PASSWORD" ]; then
  echo "Error: ALERTMANAGER_PASSWORD environment variable is not set."
  exit 1
fi

# Create the alertmanager.yml file
cat << EOL > /etc/alertmanager/alertmanager.yml
global:
  resolve_timeout: 2m
  # time to send resolved notification

route:
  receiver: 'email'

receivers:
  - name: 'email'
    email_configs:
      - send_resolved: true
        to: 'sandruozzo@gmail.com'
        from: 'sandruozzo@gmail.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'sandruozzo@gmail.com'
        auth_password: '$ALERTMANAGER_PASSWORD'
        auth_identity: 'sandruozzo@gmail.com'
        require_tls: true
        tls_config:
          insecure_skip_verify: false
EOL

echo "alertmanager.yml has been created at /etc/alertmanager/alertmanager.yml"

exec /bin/alertmanager "$@"
