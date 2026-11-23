import sharedConfig from 'lago-configs/tailwind'
import { Config } from 'tailwindcss/types/config'

import lagoUiPreset from './tailwind-preset'

const config: Pick<Config, 'presets' | 'content'> = {
  content: ['src/**/*.{ts,tsx,mdx}', '.storybook/**/*.{ts,tsx}'],
  presets: [sharedConfig, lagoUiPreset],
}

export default config
