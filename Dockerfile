FROM node:18-alpine as build

WORKDIR /app

COPY . .

ARG API_URL

ENV API_URL $API_URL

RUN yarn && yarn build && npm prune --production

FROM nginx:1.21-alpine

WORKDIR /usr/share/nginx/html

RUN apk add --no-cache bash

COPY --from=build /app/dist .
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx/gzip.conf /etc/nginx/conf.d/gzip.conf
COPY ./.env.sh ./.env.sh

EXPOSE 80

CMD ["/bin/bash", "-c", "./.env.sh && nginx -g \"daemon off;\""]