# Use the official Logstash image from Docker Elastic
# FROM docker.elastic.co/logstash/logstash:8.16.4
FROM docker.elastic.co/logstash/logstash:8.16.5


USER root
# Set working directory
WORKDIR /usr/share/logstash

# Copy necessary configuration files from your local machine to the container
COPY conf/logstash.yml /usr/share/logstash/config/logstash.yml
COPY pipeline/logstash.conf /usr/share/logstash/pipeline/logstash.conf

# Run Logstash with the provided config
CMD ["logstash", "-f", "/usr/share/logstash/pipeline/logstash.conf"]
