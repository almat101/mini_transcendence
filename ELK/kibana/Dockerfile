FROM docker.elastic.co/kibana/kibana:8.16.5


COPY config/kibana.yml /usr/share/kibana/config/kibana.yml

# Expose Kibana port
EXPOSE 5601

# Default command to start Kibana
CMD ["/bin/tini", "-s", "--", "/usr/local/bin/kibana-docker"]
