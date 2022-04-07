#!/bin/bash

rm -rf ./env-config.js
touch ./env-config.js

api_url_value=$(echo $API_URL)

echo "window.API_URL = \"$api_url_value\"" >> ./env-config.js