# syntax=docker/dockerfile:1.26

# Hardened Wolfi/apko image. Replaces the node:24-alpine -> nginx:1.31-alpine
# chain, which ran as root with a writable root filesystem. FROMs the bases
# published by getlago/lago-packages to GHCR; they are public, so no registry
# credentials are needed to build this file.
#
# Listens on 8080, not 80: nginx runs as uid 65532 and cannot bind a
# privileged port. The chart's containerPort and the pod's /tmp emptyDir move
# with it -- see the companion lago-deploy change.
#
# nginx.main.staging.conf / nginx.staging.conf are shared with
# ./Dockerfile.staging. The `.staging` suffix is now a misnomer: both files
# describe the hardened runtime, not an environment. Renaming them is a
# follow-up, kept out of this diff so the change stays reviewable.

# TAG PIN: an immutable :<lago-packages-commit-sha>. The daily rebuild keeps
# :latest within ~24h of upstream Wolfi; repin here so a base bump is a
# reviewable diff rather than a silent change under a floating tag.
ARG BUILD_IMAGE=ghcr.io/getlago/lago-front-build:4c2a516c79a6fb9e26b3bb20a139852a88e45889
ARG RUNTIME_IMAGE=ghcr.io/getlago/lago-front-base:4c2a516c79a6fb9e26b3bb20a139852a88e45889

# --- deps stage --------------------------------------------------------------
FROM ${BUILD_IMAGE} AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/configs/package.json        ./packages/configs/
COPY packages/design-system/package.json  ./packages/design-system/

RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --ignore-scripts


# --- build stage -------------------------------------------------------------
FROM ${BUILD_IMAGE} AS build

WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY --from=deps /app /app
COPY . .

ARG SENTRY_DSN
ARG SENTRY_ORG
ARG SENTRY_FRONT_PROJECT
ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION

RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    pnpm build


# --- runtime stage: hardened Wolfi nginx -------------------------------------
FROM ${RUNTIME_IMAGE}

WORKDIR /usr/share/nginx/html

COPY --from=build --chown=nonroot:nonroot /app/dist .
COPY --chown=nonroot:nonroot ./nginx/nginx.main.staging.conf /etc/nginx/nginx.conf
COPY --chown=nonroot:nonroot ./nginx/nginx.staging.conf /etc/nginx/conf.d/default.conf
COPY --chown=nonroot:nonroot ./nginx/gzip.conf /etc/nginx/conf.d/gzip.conf
COPY --chown=nonroot:nonroot ./nginx/csp.conf /etc/nginx/conf.d/csp.conf
COPY --chown=nonroot:nonroot ./.env.sh ./.env.sh

# Everything nginx writes goes to the /tmp emptyDir the pod mounts: the pid
# file, the temp paths (both in nginx.main.staging.conf) and env-config.js,
# which .env.sh emits into its cwd. The dist stays read-only and unmounted —
# an emptyDir over it would mask the built assets.
USER 65532

EXPOSE 8080

ENTRYPOINT ["/bin/bash", "-c", "cd /tmp && /usr/share/nginx/html/.env.sh && exec nginx -e /dev/stderr -g \"daemon off;\""]
