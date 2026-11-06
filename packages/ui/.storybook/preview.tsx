import { Controls, Description, Primary, Stories } from '@storybook/addon-docs/blocks'
import type { Preview } from '@storybook/react-vite'
import 'lago-configs/fonts.css'

import './tailwind.css'

import { ColorMode, ColorTheme } from '../src/components/color-theme'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      page: () => (
        <>
          <Description />
          <Primary />
          <Controls />
          <Stories />
        </>
      ),
    },
  },
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const mode: ColorMode = context.globals.theme === 'dark' ? 'dark' : 'light'

      return (
        <ColorTheme mode={mode} className="min-h-screen bg-canvas p-8 text-text-default">
          <Story />
        </ColorTheme>
      )
    },
  ],
}

export default preview
