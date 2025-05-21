# Use the Node Exporter image
FROM prom/node-exporter:v1.9.0

# Set the command to run Node Exporter with the specified options
CMD [ \
  "--no-collector.thermal_zone", \
  "--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|run)($|/)" \
]