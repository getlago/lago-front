import type { Meta, StoryObj } from '@storybook/react-vite'

import { ColorTheme } from './color-theme'
import docs from './color-theme.md?raw'

const meta = {
  title: 'Components/ColorTheme',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: ColorTheme,
  args: { mode: 'dark' },
} satisfies Meta<typeof ColorTheme>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <ColorTheme {...args} className="rounded-xl border border-border-divider bg-surface p-6">
      <p className="v2-text-body text-text-default">Region rendered in the selected mode</p>
    </ColorTheme>
  ),
}

export const Nested: Story = {
  render: () => (
    <ColorTheme mode="dark" className="rounded-xl bg-surface p-6">
      <p className="v2-text-body mb-4 text-text-default">Dark region</p>
      <ColorTheme mode="light" className="rounded-xl bg-surface p-6">
        <p className="v2-text-body text-text-default">Nested light region</p>
      </ColorTheme>
    </ColorTheme>
  ),
}
