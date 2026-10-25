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
#
# LAGO_CSP_SOURCES sets `connect-src` and `frame-src` (see csp.conf.template):
#
#   open         (default) any https:/http:/wss:/ws: origin, as before
#   report-only  `open` stays enforced; the strict sources go in a
#                Content-Security-Policy-Report-Only header
#   enforce      the strict sources are enforced
#
# The strict sources are 'self' plus the origins this script already writes to
# env-config.js:
#
#   connect-src  API_URL (or https://$LAGO_DOMAIN/api) over https and wss
#                (ActionCable), the SENTRY_DSN host, and https/wss
#                api.nango.dev when NANGO_PUBLIC_KEY is set
#   frame-src    LAGO_SUPERSET_URL (the embedded dashboards)
#
# LAGO_CSP_CONNECT_EXTRA and LAGO_CSP_FRAME_EXTRA add sources, space separated.
# In the strict modes, violations go to LAGO_CSP_REPORT_URI, or else to the
# Sentry security endpoint of SENTRY_DSN. An unknown mode, or a value with a
# newline, `"`, `$`, `;`, `\` or a backtick, stops the container: a typo must not
# fall back to `open` or drop the header without a sign.
CSP_TEMPLATE="${CSP_TEMPLATE:-/etc/nginx/csp.conf.template}"
CSP_OUTPUT="${CSP_OUTPUT:-/tmp/csp.conf}"
frame_ancestors="${LAGO_FRAME_ANCESTORS:-'self'}"
csp_mode="${LAGO_CSP_SOURCES:-open}"

open_connect_src="'self' https: http: wss: ws: blob: data:"
open_frame_src="'self' https: http:"

# Prints scheme://host[:port] of an http(s) URL, without any user info.
# Prints nothing for anything else.
origin_of() {
  local re='^(https?)://([^/?#]+)'
  [[ "$1" =~ $re ]] || return 0
  printf '%s://%s' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]##*@}"
}

# Escapes a value for the replacement side of `sed s|...|...|`.
sed_escape() {
  printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'
}

csp_api_url="${API_URL:-}"
if [ -z "$csp_api_url" ] && [ -n "${LAGO_DOMAIN:-}" ]; then
  csp_api_url="https://${LAGO_DOMAIN}/api"
fi
api_origin="$(origin_of "$csp_api_url")"
sentry_origin="$(origin_of "${SENTRY_DSN:-}")"
superset_origin="$(origin_of "${LAGO_SUPERSET_URL:-}")"

strict_connect_src="'self' blob: data:"
if [ -n "$api_origin" ]; then
  strict_connect_src+=" $api_origin $(printf '%s' "$api_origin" | sed -e 's|^https://|wss://|' -e 's|^http://|ws://|')"
fi
[ -n "$sentry_origin" ] && strict_connect_src+=" $sentry_origin"
[ -n "${NANGO_PUBLIC_KEY:-}" ] && strict_connect_src+=" https://api.nango.dev wss://api.nango.dev"
[ -n "${LAGO_CSP_CONNECT_EXTRA:-}" ] && strict_connect_src+=" $LAGO_CSP_CONNECT_EXTRA"

strict_frame_src="'self'"
[ -n "$superset_origin" ] && strict_frame_src+=" $superset_origin"
[ -n "${LAGO_CSP_FRAME_EXTRA:-}" ] && strict_frame_src+=" $LAGO_CSP_FRAME_EXTRA"

# https://<key>@<host>/<project> -> https://<host>/api/<project>/security/?sentry_key=<key>
csp_report_uri="${LAGO_CSP_REPORT_URI:-}"
dsn_re='^(https?)://([^@/]+)@([^/]+)/([0-9]+)$'
if [ -z "$csp_report_uri" ] && [[ "${SENTRY_DSN:-}" =~ $dsn_re ]]; then
  # an old-style DSN carries key:secret; only the public key goes in the header
  csp_report_uri="${BASH_REMATCH[1]}://${BASH_REMATCH[3]}/api/${BASH_REMATCH[4]}/security/?sentry_key=${BASH_REMATCH[2]%%:*}"
  [ -n "${APP_ENV:-}" ] && csp_report_uri+="&sentry_environment=${APP_ENV}"
fi

# Renders the template with the given connect-src and frame-src.
render_csp() {
  sed -e "s|__LAGO_FRAME_ANCESTORS__|$(sed_escape "$frame_ancestors")|" \
      -e "s|__LAGO_CONNECT_SRC__|$(sed_escape "$1")|" \
      -e "s|__LAGO_FRAME_SRC__|$(sed_escape "$2")|" \
      "$CSP_TEMPLATE"
}

# Adds `report-uri` to the CSP header line(s), when there is somewhere to report.
add_report_uri() {
  if [ -n "$csp_report_uri" ]; then
    sed -e "/^add_header Content-Security-Policy/s|;\" always;\$|; report-uri $(sed_escape "$csp_report_uri");\" always;|"
  else
    cat
  fi
}

# Stops the container when a value could leave the add_header string.
reject_unsafe() {
  local name value bad=$'[\n"$;\\`]'
  while [ $# -gt 0 ]; do
    name="$1" value="$2"; shift 2
    if [[ "$value" =~ $bad ]]; then
      echo ".env.sh: $name must not contain a newline, \", \$, ;, \\ or a backtick" >&2
      exit 1
    fi
  done
}
reject_unsafe LAGO_FRAME_ANCESTORS "$frame_ancestors"
if [ "$csp_mode" != open ]; then
  reject_unsafe "connect-src (API_URL, SENTRY_DSN, LAGO_CSP_CONNECT_EXTRA)" "$strict_connect_src" \
    "frame-src (LAGO_SUPERSET_URL, LAGO_CSP_FRAME_EXTRA)" "$strict_frame_src" \
    "report-uri (LAGO_CSP_REPORT_URI, SENTRY_DSN, APP_ENV)" "$csp_report_uri"
  [ -z "$csp_report_uri" ] &&
    echo ".env.sh: no LAGO_CSP_REPORT_URI and no usable SENTRY_DSN: violations are not reported" >&2
fi

if [ ! -f "$CSP_TEMPLATE" ]; then
  echo ".env.sh: $CSP_TEMPLATE is missing, cannot render $CSP_OUTPUT" >&2
  exit 1
fi

case "$csp_mode" in
  open)
    render_csp "$open_connect_src" "$open_frame_src" > "$CSP_OUTPUT"
    ;;
  report-only)
    {
      render_csp "$open_connect_src" "$open_frame_src"
      render_csp "$strict_connect_src" "$strict_frame_src" \
        | grep '^add_header Content-Security-Policy ' \
        | sed 's|^add_header Content-Security-Policy |add_header Content-Security-Policy-Report-Only |' \
        | add_report_uri
    } > "$CSP_OUTPUT"
    ;;
  enforce)
    render_csp "$strict_connect_src" "$strict_frame_src" | add_report_uri > "$CSP_OUTPUT"
    ;;
  *)
    echo ".env.sh: LAGO_CSP_SOURCES must be open, report-only or enforce, not '$csp_mode'" >&2
    exit 1
    ;;
esac
if ! grep -q '^add_header Content-Security-Policy ' "$CSP_OUTPUT"; then
  echo ".env.sh: $CSP_OUTPUT has no Content-Security-Policy header" >&2
  exit 1
fi
echo ".env.sh: CSP sources: $csp_mode" >&2

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
