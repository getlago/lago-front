FROM node:20-alpine as build

WORKDIR /app

COPY . .

RUN apk add python3 build-base && \
    corepack enable && corepack prepare pnpm@latest --activate && \
    rm -rf /app/node_modules && \
    pnpm install && pnpm build

FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

RUN apk add --no-cache bash
RUN apk update && apk upgrade libx11 nghttp2 openssl tiff curl busybox

COPY --from=build /app/dist .
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx/gzip.conf /etc/nginx/conf.d/gzip.conf
COPY ./.env.sh ./.env.sh

EXPOSE 80

ENTRYPOINT ["/bin/bash", "-c", "./.env.sh && nginx -g \"daemon off;\""]
