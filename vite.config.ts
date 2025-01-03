import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import svgr from 'vite-plugin-svgr'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

import { version } from './package.json'

const icons: Record<string, string> = {
  development: '/favicon-local.svg',
  production: '/favicon-prod.svg',
  staging: '/favicon-staging.svg',
}

const titles: Record<string, string> = {
  development: 'Lago - Local',
  production: 'Lago',
  staging: 'Lago - Cloud',
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = env.PORT ? parseInt(env.PORT) : 8080

  return {
    plugins: [
      react({
        plugins: [['@swc/plugin-styled-components', { displayName: true }]],
      }),

      // WASM for ace editor
      wasm(),
      topLevelAwait(),

      // SVG injection + optimization
      svgr({
        // including all imports that end with `.svg`
        // defaults to `.svg?react` imports but added this to keep previous behavior
        include: '**/*.svg',
        svgrOptions: {
          plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
          svgoConfig: {
            plugins: [
              {
                name: 'prefixIds',
                params: {
                  prefixIds: false,
                  prefixClassNames: false,
                },
              },
            ],
          },
        },
      }),

      // Title and favicon injection in index.html
      createHtmlPlugin({
        inject: {
          data: {
            title: titles[env.APP_ENV] || titles.production,
            favicon: icons[env.APP_ENV] || icons.production,
          },
        },
      }),
    ],
    define: {
      APP_ENV: JSON.stringify(env.APP_ENV),
      API_URL: JSON.stringify(env.API_URL),
      DOMAIN: JSON.stringify(env.LAGO_DOMAIN),
      APP_VERSION: JSON.stringify(version),
      LAGO_OAUTH_PROXY_URL: JSON.stringify(env.LAGO_OAUTH_PROXY_URL),
      LAGO_DISABLE_SIGNUP: JSON.stringify(env.LAGO_DISABLE_SIGNUP),
      NANGO_PUBLIC_KEY: JSON.stringify(env.NANGO_PUBLIC_KEY),
      SENTRY_DSN: JSON.stringify(env.SENTRY_DSN),
    },
    resolve: {
      alias: {
        '~': resolve(__dirname, 'src'),
        // Use lodash-es instead of lodash for tree-shaking
        lodash: 'lodash-es',
        '@mui/styled-engine': resolve(__dirname, 'node_modules/@mui/styled-engine-sc'),
      },
    },
    server: {
      port,
    },
    preview: {
      port,
    },
    build: {
      outDir: 'dist',
      sourcemap: true, // TODO: replace this with the sentry vite plugin and don't ship sourcemaps to production
      rollupOptions: {
        output: {
          chunkFileNames: '[name].[hash].js',
          entryFileNames: '[name].[hash].js',
          sourcemapFileNames: '[name].[hash].js.map',
        },
      },
    },
  }
})
