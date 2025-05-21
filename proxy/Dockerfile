FROM nginx:alpine

#RUN apt-get update
#RUN apt-get upgrade -y
#RUN apt-get install -y openssl vim sudo curl net-tools
RUN apk update && apk add --no-cache curl vim sudo net-tools

#RUN mkdir -p /etc/nginx/ssl/

# Copy Nginx configuration
COPY conf/nginx.conf /etc/nginx/nginx.conf

# Copy Nginx conf.d
COPY conf.d/gateway.conf /etc/nginx/conf.d/

# Copy frontend directory into var/www/html of the container
COPY frontend /var/www/html

COPY tools/proxy.sh /usr/local/bin/proxy.sh
RUN chmod +x /usr/local/bin/proxy.sh

CMD ["/usr/local/bin/proxy.sh"]
