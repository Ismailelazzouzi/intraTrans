FROM nginx/nginx-prometheus-exporter:1.4.2

# The upstream image is scratch-based (no shell, no utilities).
# Copy busybox from Alpine to enable Docker healthchecks via wget.
USER 0:0
COPY --from=busybox:musl /bin/busybox /bin/busybox
RUN ["/bin/busybox", "ln", "-s", "/bin/busybox", "/bin/wget"]
RUN ["/bin/busybox", "ln", "-s", "/bin/busybox", "/bin/sh"]
USER 1001:1001

ENTRYPOINT ["/usr/bin/nginx-prometheus-exporter"]
