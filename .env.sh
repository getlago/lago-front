#!/bin/bash

rm -rf ./env-config.js
touch ./env-config.js

api_url_value=$(echo $API_URL)
app_env_value=$(echo $APP_ENV)
lago_disable_signup_value=$(echo $LAGO_DISABLE_SIGNUP)

echo "window.API_URL = \"$api_url_value\"" >> ./env-config.js
echo "window.APP_ENV = \"$app_env_value\"" >> ./env-config.js
echo "window.LAGO_DISABLE_SIGNUP = \"$lago_disable_signup_value\"" >> ./env-config.js