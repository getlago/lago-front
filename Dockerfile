FROM node:14-alpine as build

WORKDIR /app

COPY . .

ARG API_URL
ARG APP_DOMAIN

ENV API_URL $API_URL
ENV APP_DOMAIN $APP_DOMAIN

RUN yarn && yarn build && npm prune --production

FROM nginx:1.21-alpine

WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist .
COPY --from=build /app/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]