#!/bin/bash
# Not two bare lines: a failed install would still start vite, and with
# `restart: unless-stopped` the real error (e.g. ENOSPC) loops as "vite: not found".
set -e

pnpm install
pnpm run dev
