#!/bin/bash

rm -rf ./env-config.js
touch ./env-config.js

api_url_value=$(echo $API_URL)
app_env_value=$(echo $APP_ENV)
lago_oauth_proxy_url_value=$(echo $LAGO_OAUTH_PROXY_URL)
lago_disable_signup_value=$(echo $LAGO_DISABLE_SIGNUP)
sentry_dsn_value=$(echo $SENTRY_DSN)

echo "window.API_URL = \"$api_url_value\"" >> ./env-config.js
echo "window.APP_ENV = \"$app_env_value\"" >> ./env-config.js
echo "window.LAGO_OAUTH_PROXY_URL = \"$lago_oauth_proxy_url_value\"" >> ./env-config.js
echo "window.LAGO_DISABLE_SIGNUP = \"$lago_disable_signup_value\"" >> ./env-config.js
echo "window.SENTRY_DSN = \"$sentry_dsn_value\"" >> ./env-config.js