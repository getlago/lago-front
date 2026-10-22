#!/bin/bash
# No `set -u`: several of the variables below are optional and unset on
# self-hosted deployments.

# --- nginx CSP ---------------------------------------------------------------
# Render /etc/nginx/csp.conf.template to /tmp/csp.conf, which every location in
# nginx.conf includes. /tmp is the only writable path on the hardened image
# (read-only rootfs), so the rendered file cannot live next to the template.
#
# LAGO_FRAME_ANCESTORS lists the origins allowed to embed this app in an
# iframe, space separated, in CSP source syntax. For example:
#
#   LAGO_FRAME_ANCESTORS="'self' https://portal.example.com *.example.dev"
#
# The default is `'self'`: only this app may frame itself. Set the variable
# when you embed Lago in another application, and list only your own origins.
#
# Deliberately no origins are hard-coded here. This repository is public, so a
# baked list publishes whoever is on it. A deployment's partner origins are
# also specific to that deployment, and have no meaning in anyone else's.
# They belong in that deployment's configuration, not in the image.
CSP_TEMPLATE="${CSP_TEMPLATE:-/etc/nginx/csp.conf.template}"
CSP_OUTPUT="${CSP_OUTPUT:-/tmp/csp.conf}"
frame_ancestors="${LAGO_FRAME_ANCESTORS:-'self'}"

if [ -f "$CSP_TEMPLATE" ]; then
  # `|` as the delimiter: the list holds dots and stars but never a pipe.
  sed "s|__LAGO_FRAME_ANCESTORS__|${frame_ancestors}|" "$CSP_TEMPLATE" > "$CSP_OUTPUT"
else
  echo ".env.sh: $CSP_TEMPLATE is missing, cannot render $CSP_OUTPUT" >&2
  exit 1
fi

# --- runtime app config ------------------------------------------------------
rm -rf ./env-config.js
touch ./env-config.js

api_url_value=$(echo $API_URL)
domain_value=$(echo $LAGO_DOMAIN)
app_env_value=$(echo $APP_ENV)
lago_oauth_proxy_url_value=$(echo $LAGO_OAUTH_PROXY_URL)
lago_disable_signup_value=$(echo $LAGO_DISABLE_SIGNUP)
nango_public_key=$(echo $NANGO_PUBLIC_KEY)
sentry_dsn_value=$(echo $SENTRY_DSN)
lago_disable_pdf_generation=$(echo $LAGO_DISABLE_PDF_GENERATION)
lago_superset_url=$(echo $LAGO_SUPERSET_URL)

echo "window.API_URL = \"$api_url_value\"" >> ./env-config.js
echo "window.LAGO_DOMAIN = \"$domain_value\"" >> ./env-config.js
echo "window.APP_ENV = \"$app_env_value\"" >> ./env-config.js
echo "window.LAGO_OAUTH_PROXY_URL = \"$lago_oauth_proxy_url_value\"" >> ./env-config.js
echo "window.LAGO_DISABLE_SIGNUP = \"$lago_disable_signup_value\"" >> ./env-config.js
echo "window.NANGO_PUBLIC_KEY = \"$nango_public_key\"" >> ./env-config.js
echo "window.SENTRY_DSN = \"$sentry_dsn_value\"" >> ./env-config.js
echo "window.LAGO_DISABLE_PDF_GENERATION = \"$lago_disable_pdf_generation\"" >> ./env-config.js
echo "window.LAGO_SUPERSET_URL = \"$lago_superset_url\"" >> ./env-config.js
