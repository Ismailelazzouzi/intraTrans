FROM        owasp/modsecurity-crs:nginx-alpine

LABEL        maintainer="Hive-devops"
LABEL        service="webserver"

USER        root

RUN        mkdir -p /www /app/media /var/cache/nginx /var/run/nginx /var/log/nginx && \ 
        chown -R nginx:nginx /www /app/media /var/cache/nginx /var/run/nginx /var/log/nginx

COPY        devops/prod/webserver/nginx.conf /etc/nginx/nginx.conf
COPY        devops/prod/webserver/conf.d /etc/nginx/conf.d
COPY        devops/prod/webserver/snippets /etc/nginx/snippets
COPY        devops/prod/webserver/modsecurity /etc/nginx/modsecurity
# COPY        devops/monitoring/auth/.htpasswd /etc/nginx/monitoring/.htpasswd

USER        nginx

EXPOSE        80/tcp 443/tcp

STOPSIGNAL    SIGQUIT

ENTRYPOINT    [ "nginx", "-g", "daemon off;" ]