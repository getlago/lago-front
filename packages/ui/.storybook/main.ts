import type { StorybookConfig } from '@storybook/react-vite'

const brandDir = new URL('.', import.meta.resolve('lago-configs/brand/lago-logo.svg')).pathname

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  staticDirs: [
    { from: brandDir, to: '/brand' },
    { from: `${brandDir}lago-mark.svg`, to: '/favicon.svg' },
  ],
  core: { disableWhatsNewNotifications: true },
  features: {
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
}

export default config
