ARG NGINX_IMAGE=nginx:1.28-alpine
FROM ${NGINX_IMAGE}
COPY deploy/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
EXPOSE 80
