#!/bin/sh
# Prometheus v3 removed --config.expand-env, so we pre-process
# the config template to substitute environment variables.
# Output to /tmp because the container runs with read_only: true.
sed "s|\${METRICS_SECRET}|${METRICS_SECRET}|g" \
  /etc/prometheus/prometheus.yml.tmpl > /tmp/prometheus.yml

exec /bin/prometheus "$@"
