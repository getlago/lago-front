#!/usr/bin/env bash
# Exercises the CSP rendering in .env.sh against nginx/csp.conf.template:
# the three LAGO_CSP_SOURCES modes, origin derivation and the report URI.
# Run: bash nginx/csp.test.sh
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d)"
trap 'rm -rf "$test_root"' EXIT

# Runs .env.sh with a clean environment plus the given VAR=value pairs.
# Prints the rendered csp.conf without comments, then rc=<exit code>.
render() {
  rm -f "$test_root/csp.conf"
  (
    cd "$test_root" &&
      env -i PATH="$PATH" CSP_TEMPLATE="$repo_root/nginx/csp.conf.template" \
        CSP_OUTPUT="$test_root/csp.conf" "$@" bash "$repo_root/.env.sh" 2>/dev/null
  ) && rc=0 || rc=$?
  # directives only: the template's comments name the placeholders and headers
  grep -v '^ *#' "$test_root/csp.conf" 2>/dev/null || true
  echo "rc=$rc"
}

# The value of one header line in rendered output.
header() { grep "^add_header $1 " | sed -e "s|^add_header $1 \"||" -e 's|" always;$||'; }
# One directive of a policy.
directive() { tr ';' '\n' | sed 's/^ *//' | grep "^$1 " || true; }

fail=0
expect_eq() {
  if [[ "$3" == "$2" ]]; then echo "ok   $1"; else
    echo "FAIL $1"; echo "  want: $2"; echo "  got:  $3"; fail=1
  fi
}
expect_has() { if [[ "$3" == *"$2"* ]]; then echo "ok   $1"; else echo "FAIL $1 — '$2' not in: $3"; fail=1; fi; }
expect_not() { if [[ "$3" != *"$2"* ]]; then echo "ok   $1"; else echo "FAIL $1 — '$2' found in: $3"; fail=1; fi; }

CLOUD=(
  API_URL=https://api.example.com/api
  SENTRY_DSN=https://abc123@o42.ingest.de.sentry.io/4507
  NANGO_PUBLIC_KEY=pk
  LAGO_SUPERSET_URL=https://bi.example.com/
  APP_ENV=staging
)
STRICT_CONNECT="connect-src 'self' blob: data: https://api.example.com wss://api.example.com https://o42.ingest.de.sentry.io https://api.nango.dev wss://api.nango.dev"
STRICT_FRAME="frame-src 'self' https://bi.example.com"
REPORT_URI="report-uri https://o42.ingest.de.sentry.io/api/4507/security/?sentry_key=abc123&sentry_environment=staging"

# --- open (default): identical to the policy before LAGO_CSP_SOURCES ---------
out="$(render "${CLOUD[@]}")"
expect_has "open: exits 0" "rc=0" "$out"
# Byte-for-byte against the template before this change, when git has it.
if legacy_tpl="$(git -C "$repo_root" show origin/main:nginx/csp.conf.template 2>/dev/null)" &&
  [[ "$legacy_tpl" != *__LAGO_CONNECT_SRC__* ]]; then
  expect_eq "open: CSP header identical to origin/main" \
    "$(sed "s|__LAGO_FRAME_ANCESTORS__|'self'|" <<<"$legacy_tpl" | header Content-Security-Policy)" \
    "$(header Content-Security-Policy <<<"$out")"
fi
expect_eq "open: connect-src unchanged" "connect-src 'self' https: http: wss: ws: blob: data:" \
  "$(header Content-Security-Policy <<<"$out" | directive connect-src)"
expect_eq "open: frame-src unchanged" "frame-src 'self' https: http:" \
  "$(header Content-Security-Policy <<<"$out" | directive frame-src)"
expect_eq "open: frame-ancestors defaults to 'self'" "frame-ancestors 'self'" \
  "$(header Content-Security-Policy <<<"$out" | directive frame-ancestors)"
expect_not "open: no report-only header" "Report-Only" "$out"
expect_not "open: no report-uri" "report-uri" "$out"
expect_not "open: no placeholder left" "__LAGO_" "$out"
expect_has "open: other headers survive" "X-Content-Type-Options" "$out"

# --- enforce ------------------------------------------------------------------
out="$(render "${CLOUD[@]}" LAGO_CSP_SOURCES=enforce)"
policy="$(header Content-Security-Policy <<<"$out")"
expect_has "enforce: exits 0" "rc=0" "$out"
expect_eq "enforce: connect-src is strict" "$STRICT_CONNECT" "$(directive connect-src <<<"$policy")"
expect_eq "enforce: frame-src is strict" "$STRICT_FRAME" "$(directive frame-src <<<"$policy")"
expect_eq "enforce: reports to the Sentry security endpoint" "$REPORT_URI" "$(directive report-uri <<<"$policy")"
expect_not "enforce: no report-only header" "Report-Only" "$out"
expect_not "enforce: no placeholder left" "__LAGO_" "$out"

# --- report-only --------------------------------------------------------------
out="$(render "${CLOUD[@]}" LAGO_CSP_SOURCES=report-only)"
enforced="$(header Content-Security-Policy <<<"$out")"
reported="$(header Content-Security-Policy-Report-Only <<<"$out")"
expect_has "report-only: exits 0" "rc=0" "$out"
expect_eq "report-only: enforced connect-src stays open" \
  "connect-src 'self' https: http: wss: ws: blob: data:" "$(directive connect-src <<<"$enforced")"
expect_not "report-only: enforced header has no report-uri" "report-uri" "$enforced"
expect_eq "report-only: reported connect-src is strict" "$STRICT_CONNECT" "$(directive connect-src <<<"$reported")"
expect_eq "report-only: reported frame-src is strict" "$STRICT_FRAME" "$(directive frame-src <<<"$reported")"
expect_eq "report-only: reported header has the report-uri" "$REPORT_URI" "$(directive report-uri <<<"$reported")"
expect_eq "report-only: one header of each" "2" "$(grep -c '^add_header Content-Security-Policy' <<<"$out")"

# --- derivation edge cases ----------------------------------------------------
out="$(render LAGO_CSP_SOURCES=enforce LAGO_DOMAIN=lago.example.org)"
expect_eq "LAGO_DOMAIN fallback, no Sentry, no Nango" \
  "connect-src 'self' blob: data: https://lago.example.org wss://lago.example.org" \
  "$(header Content-Security-Policy <<<"$out" | directive connect-src)"
expect_not "no DSN: no report-uri" "report-uri" "$out"
expect_eq "no Superset URL: frame-src is 'self'" "frame-src 'self'" \
  "$(header Content-Security-Policy <<<"$out" | directive frame-src)"

out="$(render LAGO_CSP_SOURCES=enforce API_URL=http://localhost:3000)"
expect_eq "plain http API gets ws://, port kept" \
  "connect-src 'self' blob: data: http://localhost:3000 ws://localhost:3000" \
  "$(header Content-Security-Policy <<<"$out" | directive connect-src)"

out="$(render LAGO_CSP_SOURCES=enforce API_URL=https://api.example.com \
  LAGO_CSP_CONNECT_EXTRA="https://a.example.com wss://b.example.com" \
  LAGO_CSP_FRAME_EXTRA=https://c.example.com \
  LAGO_CSP_REPORT_URI="https://csp.example.com/r?x=1&y=2")"
policy="$(header Content-Security-Policy <<<"$out")"
expect_has "connect extra appended" "wss://api.example.com https://a.example.com wss://b.example.com" "$policy"
expect_eq "frame extra appended" "frame-src 'self' https://c.example.com" "$(directive frame-src <<<"$policy")"
expect_eq "explicit report URI wins, & kept" "report-uri https://csp.example.com/r?x=1&y=2" \
  "$(directive report-uri <<<"$policy")"

# --- failures -----------------------------------------------------------------
expect_has "unknown mode stops the container" "rc=1" "$(render LAGO_CSP_SOURCES=enforced)"
expect_has "missing template stops the container" "rc=1" \
  "$(cd "$test_root" && env -i PATH="$PATH" CSP_TEMPLATE=/nonexistent CSP_OUTPUT="$test_root/x" \
    bash "$repo_root/.env.sh" >/dev/null 2>&1 && echo rc=0 || echo "rc=$?")"

exit "$fail"
