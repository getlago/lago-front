import { sentryVitePlugin } from '@sentry/vite-plugin'
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
  const isProduction = mode === 'production'
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN
  const sentryOrg = env.SENTRY_ORG || 'lago'
  const sentryProject = env.SENTRY_FRONT_PROJECT || 'front'
  const appVersion = env.APP_VERSION
  const shouldUploadSourceMaps =
    isProduction && sentryAuthToken && sentryOrg && sentryProject && appVersion

  const plugins = [
    react(),
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
          title: titles[env.APP_ENV] || titles.production,
          favicon: icons[env.APP_ENV] || icons.production,
        },
      },
    }),
  ]

  // Add Sentry plugin only in production builds with required env vars
  if (shouldUploadSourceMaps) {
    plugins.push(
      sentryVitePlugin({
        org: sentryOrg,
        project: sentryProject,
        authToken: sentryAuthToken,
        release: {
          name: appVersion,
          // Use release-based source map instead of Debug IDs
          // This is needed because Debug ID injection is not working correctly
          // with this build setup. The legacy method matches source maps by
          // release name + file path instead of Debug IDs.
          // Docs: https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/
          uploadLegacySourcemaps: {
            paths: ['./dist'],
            urlPrefix: '~/',
          },
        },
        sourcemaps: {
          disable: true,
        },
        debug: true,
        telemetry: false,
      }),
    )

    console.log(
      `✅ Sentry source maps will be uploaded for app version: ${appVersion}, sentryOrg: ${sentryOrg}, sentryProject: ${sentryProject}`,
    )
  } else if (isProduction) {
    const missingVars: string[] = []

    if (!sentryAuthToken) missingVars.push('SENTRY_AUTH_TOKEN')
    if (!sentryOrg) missingVars.push('SENTRY_ORG')
    if (!sentryProject) missingVars.push('SENTRY_FRONT_PROJECT')
    if (!appVersion) missingVars.push('APP_VERSION')

    if (missingVars.length > 0) {
      console.log(
        `⚠️ Sentry source maps upload skipped. Missing environment variables: ${missingVars.join(', ')}`,
      )
    }
  }

  return {
    plugins,
    define: {
      APP_ENV: JSON.stringify(env.APP_ENV),
      API_URL: JSON.stringify(env.API_URL),
      DOMAIN: JSON.stringify(env.LAGO_DOMAIN),
      APP_VERSION: JSON.stringify(appVersion || version), // Fallback to package.json version when APP_VERSION env var is not set
      LAGO_OAUTH_PROXY_URL: JSON.stringify(env.LAGO_OAUTH_PROXY_URL),
      LAGO_DISABLE_SIGNUP: JSON.stringify(env.LAGO_DISABLE_SIGNUP),
      NANGO_PUBLIC_KEY: JSON.stringify(env.NANGO_PUBLIC_KEY),
      SENTRY_DSN: JSON.stringify(env.SENTRY_DSN),
      LAGO_DISABLE_PDF_GENERATION: JSON.stringify(env.LAGO_DISABLE_PDF_GENERATION),
    },
    resolve: {
      alias: {
        '~': resolve(__dirname, 'src'),
        lodash: 'lodash-es',
      },
    },
    server: {
      port,
      host: true,
      strictPort: true,
      allowedHosts: ['app.lago.dev'],
    },
    preview: {
      port,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      target: 'esnext',
      rollupOptions: {
        output: {
          chunkFileNames: '[name].[hash].js',
          entryFileNames: '[name].[hash].js',
          sourcemapFileNames: '[name].[hash].js.map',
        },
      },
      exclude: ['packages/**'],
    },
  }
})
