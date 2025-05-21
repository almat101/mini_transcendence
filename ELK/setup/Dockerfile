FROM docker.elastic.co/elasticsearch/elasticsearch:8.16.4

# Switch to root user to ensure proper permissions
USER root

# Copy files into the container
COPY tools/setup.sh /usr/share/elasticsearch/setup.sh
COPY config/elastic/ /usr/share/elasticsearch/config/elastic/

# Set correct permissions
RUN chmod +x /usr/share/elasticsearch/setup.sh


# USER elasticsearch

# Define the command to run
CMD ["/usr/share/elasticsearch/setup.sh"]