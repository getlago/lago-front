#!/bin/bash

rm -rf ./env-config.js
touch ./env-config.js

api_url_value=$(echo $API_URL)
app_env_value=$(echo $APP_ENV)
lago_signup_disabled_value=$(echo $LAGO_SIGNUP_DISABLED)

echo "window.API_URL = \"$api_url_value\"" >> ./env-config.js
echo "window.APP_ENV = \"$app_env_value\"" >> ./env-config.js
echo "window.LAGO_SIGNUP_DISABLED = \"$lago_signup_disabled_value\"" >> ./env-config.js