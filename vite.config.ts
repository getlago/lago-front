import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import svgr from 'vite-plugin-svgr'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

import { version } from './package.json'

dotenv.config()

export default defineConfig((env) => {
  return {
    plugins: [
      react({
        babel: {
          plugins: [
            ['babel-plugin-styled-components', { displayName: true }],
            [
              'prismjs',
              {
                languages: ['javascript', 'bash'],
                plugins: ['line-numbers'],
                theme: 'default',
                css: true,
              },
            ],
          ],
        },
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
              env.mode === 'development'
                ? 'Lago - Local'
                : env.mode === 'production'
                  ? 'Lago'
                  : 'Lago - Cloud',
            favicon:
              env.mode === 'development'
                ? '/favicon-local.svg'
                : env.mode === 'production'
                  ? '/favicon-prod.svg'
                  : '/favicon-staging.svg',
          },
        },
      }),
    ],
    define: {
      APP_ENV: JSON.stringify(env.mode),
      API_URL: JSON.stringify(process.env.API_URL),
      DOMAIN: JSON.stringify(process.env.LAGO_DOMAIN),
      APP_VERSION: JSON.stringify(version),
      LAGO_OAUTH_PROXY_URL: JSON.stringify(process.env.LAGO_OAUTH_PROXY_URL),
      LAGO_DISABLE_SIGNUP: JSON.stringify(process.env.LAGO_DISABLE_SIGNUP),
      NANGO_PUBLIC_KEY: JSON.stringify(process.env.NANGO_PUBLIC_KEY),
      SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN),
    },
    resolve: {
      alias: {
        '~': resolve(__dirname, 'src'),
        lodash: 'lodash-es',
        '@mui/styled-engine': resolve(__dirname, 'node_modules/@mui/styled-engine-sc'),
      },
    },
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
      proxy: {
        '/api': {
          target: process.env.API_URL,
          changeOrigin: true,
          secure: false,
        },
      },
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
