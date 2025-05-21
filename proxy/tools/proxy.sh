#!bin/bash

# Create a self-signed SSL certificate then move to a script.sh
echo "Create a self-signed SSL certificate"
openssl req -x509 -nodes -out /etc/ssl/certs/nginx-selfsigned.crt -keyout /etc/ssl/private/nginx-selfsigned.key -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=localhost/UID=test_user" > /dev/null 2>&1
# openssl req -x509 -nodes -out ${CERTS} -keyout ${KEYS} -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=${DOMAIN_NAME}/UID=${USER}" > /dev/null 2>&1

# Start NGINX in foreground
echo "Start NGINX-proxy in foreground"
nginx -g "daemon off;"
