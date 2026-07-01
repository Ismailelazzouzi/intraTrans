FROM node:22-alpine AS builder

WORKDIR /app
COPY frontEnd/package*.json ./
RUN npm ci

COPY frontEnd/ .
ENV VITE_API_URL=/api
ENV VITE_GOOGLE_AUTH_URL=/api/auth/google
RUN npx vite build

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY devops/dev/nginx.conf /etc/nginx/nginx.conf
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
