FROM node:24.11.1-alpine AS build

ARG SENTRY_DSN
ARG SENTRY_ORG
ARG SENTRY_FRONT_PROJECT
ARG SENTRY_AUTH_TOKEN
ARG APP_VERSION

ENV APP_VERSION=$APP_VERSION
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

RUN apk add python3 build-base && corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpmfile.docker.cjs ./
RUN pnpm install --pnpmfile=./pnpmfile.docker.cjs
COPY . .
RUN pnpm install && pnpm build

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
