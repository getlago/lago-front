import type { StorybookConfig } from '@storybook/react-vite'
import { fileURLToPath } from 'node:url'

const brandDir = fileURLToPath(
  new URL('.', import.meta.resolve('lago-configs/brand/lago-logo.svg')),
)

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)', '../../../src/stories/v2/**/*.stories.tsx'],
  viteFinal: async (viteConfig) => {
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: {
        ...viteConfig.resolve?.alias,
        '~': fileURLToPath(new URL('../../../src', import.meta.url)),
      },
    }
    viteConfig.define = {
      ...viteConfig.define,
      APP_ENV: JSON.stringify('development'),
      APP_VERSION: JSON.stringify('storybook'),
      API_URL: JSON.stringify(''),
      LAGO_OAUTH_PROXY_URL: JSON.stringify(''),
      LAGO_DISABLE_SIGNUP: JSON.stringify('true'),
      LAGO_SELF_SERVE_ENABLED: JSON.stringify('false'),
      LAGO_US_FRONT_URL: JSON.stringify(''),
      LAGO_EU_FRONT_URL: JSON.stringify(''),
      LAGO_RECAPTCHA_SITE_KEY: JSON.stringify(''),
      NANGO_PUBLIC_KEY: JSON.stringify(''),
      SENTRY_DSN: JSON.stringify(''),
      LAGO_DISABLE_PDF_GENERATION: JSON.stringify('true'),
      LAGO_SUPERSET_URL: JSON.stringify(''),
    }
    return viteConfig
  },
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  staticDirs: [
    { from: brandDir, to: '/brand' },
    { from: `${brandDir}lago-mark.svg`, to: '/favicon.svg' },
    { from: `${brandDir}lago-mark.svg`, to: '/lago-mark.svg' },
  ],
  core: { disableWhatsNewNotifications: true },
  features: {
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
}

export default config
