# syntax=docker/dockerfile:1.28

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

# BASE PIN: :<lago-packages-commit-sha>@<index digest>. The digest is what
# Docker resolves; the commit tag says where it came from. The daily rebuild
# keeps :latest within ~24h of upstream Wolfi; repin here so a base bump is a
# reviewable diff rather than a silent change under a floating tag.
#
# Current pin: lago-packages 8a2dbce, published as 20261022-r64. It ships
# ca-certificates-bundle 20260909-r3, which removes the eMudhra/emSign roots.
ARG BUILD_IMAGE=ghcr.io/getlago/lago-front-build:8a2dbced16532c16a8e068327f31da9b32d0304a@sha256:c43db7afeeba2852b6e8caf260783e615605caadee4adc51faf526653518949a
ARG RUNTIME_IMAGE=ghcr.io/getlago/lago-front-base:8a2dbced16532c16a8e068327f31da9b32d0304a@sha256:5178314792a2af6bc97d709c7026f5c70306068ef370a6d4abec0f7017c359c0

# --- deps stage --------------------------------------------------------------
FROM ${BUILD_IMAGE} AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/configs/package.json        ./packages/configs/
COPY packages/design-system/package.json  ./packages/design-system/

# --ignore-scripts: postinstall builds workspace sources not copied yet;
# `pnpm build` (prebuild) does it in the next stage.
RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --ignore-scripts


# --- build stage -------------------------------------------------------------
FROM ${BUILD_IMAGE} AS build

WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY --from=deps /app /app
COPY . .

# Late ARGs: an APP_VERSION change invalidates only `pnpm build`.
# SENTRY_AUTH_TOKEN is a secret mount, not an ARG: ARGs leak into the image
# history.
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

COPY --from=build /app/dist .
COPY ./nginx/nginx.main.staging.conf /etc/nginx/nginx.conf
COPY ./nginx/nginx.staging.conf /etc/nginx/conf.d/default.conf
COPY ./nginx/gzip.conf /etc/nginx/conf.d/gzip.conf
COPY ./nginx/csp.conf.template /etc/nginx/csp.conf.template
COPY ./.env.sh ./.env.sh

# Everything nginx writes goes to the /tmp emptyDir the pod mounts: the pid
# file, the temp paths (both in nginx.main.staging.conf), and the two files
# .env.sh renders at start: env-config.js (into its cwd) and csp.conf. The
# dist stays read-only and unmounted: an emptyDir over it would mask the
# built assets. Files stay root-owned so nginx cannot rewrite them, even on
# a writable root filesystem.
USER 65532

EXPOSE 8080

# `exec` makes nginx PID 1, so it gets SIGTERM.
ENTRYPOINT ["/bin/bash", "-c", "cd /tmp && /usr/share/nginx/html/.env.sh && exec nginx -e /dev/stderr -g \"daemon off;\""]
