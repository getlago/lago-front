#!/usr/bin/env bash
set -euo pipefail

NODE_VERSION=$(node -p "require('./package.json').engines.node")
PACKAGE_MANAGER=$(node -p "require('./package.json').packageManager")
npm install --global --prefix /usr/local "node@$NODE_VERSION" "$PACKAGE_MANAGER"
export PATH="/usr/local/bin:$PATH"

pnpm install --frozen-lockfile
