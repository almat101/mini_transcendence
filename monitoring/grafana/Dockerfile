# FROM grafana/grafana:11.5.2
FROM grafana/grafana:12.3

# # Copy custom grafana.ini
# COPY /conf/grafana.ini /etc/grafana/grafana.ini

# Copy custom dashboards
COPY /dashboards /var/lib/grafana/dashboards

# Copy provisioning files
COPY /provisioning /etc/grafana/provisioning

# Start Grafana server
CMD ["/run.sh"]