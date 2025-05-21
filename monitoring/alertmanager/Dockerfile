# Use the Alertmanager image
FROM prom/alertmanager:v0.28.1

USER root
COPY tools/alert_email.sh /etc/alertmanager/alert_email.sh
RUN chmod +x /etc/alertmanager/alert_email.sh

USER nobody

ENTRYPOINT ["/bin/sh", "/etc/alertmanager/alert_email.sh"]

# Default arguments for Alertmanager
CMD ["--config.file=/etc/alertmanager/alertmanager.yml"]