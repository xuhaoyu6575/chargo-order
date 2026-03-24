# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/templates/default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
# 与 docker-compose 中后端服务名一致；单独运行时可通过 -e API_UPSTREAM=host.docker.internal 指向宿主机后端
ENV API_UPSTREAM=api
