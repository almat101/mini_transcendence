# Use the Prometheus image
FROM prom/prometheus:v3.2.1

# Copy configuration files into the container
COPY conf/prometheus.yml /etc/prometheus/prometheus.yml
COPY rules/rules_1.yml /etc/prometheus/rules_1.yml
COPY rules/rules_2.yml /etc/prometheus/rules_2.yml
COPY rules/rules_3.yml /etc/prometheus/rules_3.yml
COPY rules/rules_4.yml /etc/prometheus/rules_4.yml

# Set the command to run Prometheus with the specified configuration
CMD [ \
  "--config.file=/etc/prometheus/prometheus.yml", \
  "--storage.tsdb.path=/prometheus", \
  "--storage.tsdb.retention.time=10d" \ 
]

#retention time 10 days then delete the scraped data