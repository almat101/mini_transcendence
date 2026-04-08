FROM nginx:1.29.6-alpine

RUN apk update && apk upgrade && apk add --no-cache curl vim sudo net-tools

COPY ./conf/nginx.conf /etc/nginx/nginx.conf

COPY ./conf.d/gateway.conf /etc/nginx/conf.d/

COPY frontend /usr/share/nginx/html

RUN chown -R nginx:nginx /var/log/nginx /var/cache/nginx /run 

USER nginx

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f -s http://localhost:8090/ping || exit 1

EXPOSE 8090

CMD ["nginx", "-g", "daemon off;"]
