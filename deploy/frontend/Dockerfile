ARG NGINX_IMAGE=nginx:1.28-alpine
FROM ${NGINX_IMAGE}
RUN apk add --no-cache jq
COPY deploy/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
COPY deploy/frontend/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod 0755 /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 80
