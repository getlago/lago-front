import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import svgr from 'vite-plugin-svgr'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

import { version } from './package.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react({
        plugins: [['@swc/plugin-styled-components', { displayName: true }]],
      }),
      wasm(),
      topLevelAwait(),
      svgr({
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
      createHtmlPlugin({
        inject: {
          data: {
            title:
              mode === 'development'
                ? 'Lago - Local'
                : mode === 'production'
                  ? 'Lago'
                  : 'Lago - Cloud',
            favicon:
              mode === 'development'
                ? '/favicon-local.svg'
                : mode === 'production'
                  ? '/favicon-prod.svg'
                  : '/favicon-staging.svg',
          },
        },
      }),
    ],
    define: {
      APP_ENV: JSON.stringify(mode),
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
        lodash: 'lodash-es',
        '@mui/styled-engine': resolve(__dirname, 'node_modules/@mui/styled-engine-sc'),
      },
    },
    server: {
      port: env.PORT ? parseInt(env.PORT) : 8080,
      proxy: {
        '/api': {
          target: env.API_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: env.PORT ? parseInt(env.PORT) : 8080,
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // TODO: replace this with the sentry vite plugin and don't ship sourcemaps to production
      rollupOptions: {
        output: {
          chunkFileNames: '[name].[hash].js',
          entryFileNames: '[name].[hash].js',
        },
      },
    },
  }
})
