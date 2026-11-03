# Vendored packages

These tarballs are not on npm. `package.json` installs them with `file:vendor/<tarball>`.

| Tarball | Package | Source |
| --- | --- | --- |
| `d3set-0.1.0.tgz` | `d3set` | The root of the d3set repository |
| `d3set-react-0.1.0.tgz` | `@d3set/react` | `packages/react` in the d3set repository |

The Analytics page at `/analytics-d3set` draws its charts with them.

## Refresh them

From a d3set checkout, with Node 24:

```sh
npm ci
npm run build                      # dist/ of d3set
npm run build -w packages/react    # dist/ of @d3set/react
npm pack --pack-destination <lago-front>/vendor
(cd packages/react && npm pack --pack-destination <lago-front>/vendor)
```

Then, in lago-front:

```sh
pnpm add -w d3set@file:vendor/d3set-0.1.0.tgz @d3set/react@file:vendor/d3set-react-0.1.0.tgz
```

`pnpm-lock.yaml` keeps the integrity hash of each tarball, so a plain `pnpm install` fails on a new
tarball with the same name. `pnpm add` reads the tarballs again and writes the new hashes.

Commit the tarballs and `pnpm-lock.yaml` together. If the version in a tarball name changes,
change it in `package.json` too.
