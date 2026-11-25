import type { Meta, StoryObj } from '@storybook/react-vite'
import { Copy, Download, Plus } from 'lucide-react'

import { IconButton } from './icon-button'
import docs from './icon-button.md?raw'
import { TooltipProvider } from './tooltip'

const sizes = [
  { size: 'icon-xs', label: 'Extra small · 20px' },
  { size: 'icon-sm', label: 'Small · 32px' },
  { size: 'icon', label: 'Default · 36px' },
  { size: 'icon-lg', label: 'Large · 40px' },
] as const

const meta = {
  title: 'Components/IconButton',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: IconButton,
  args: {
    label: 'Copy invoice number',
    variant: 'secondary',
    size: 'icon',
    children: <Copy aria-hidden="true" />,
  },
  argTypes: {
    size: {
      control: 'select',
      options: sizes.map(({ size }) => size),
    },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof IconButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6" role="group" aria-label="Icon button sizes">
      {sizes.map(({ size, label }) => (
        <div key={size} className="flex flex-col items-start gap-2">
          <IconButton label={`Copy invoice number (${label})`} variant="secondary" size={size}>
            <Copy aria-hidden="true" />
          </IconButton>
          <span className="v2-text-caption text-text-muted">{label}</span>
        </div>
      ))}
    </div>
  ),
}

export const BlockedStates: Story = {
  render: () => (
    <div className="flex gap-4" role="group" aria-label="Blocked icon actions">
      <IconButton label="Copy unavailable" variant="secondary" disabled>
        <Copy aria-hidden="true" />
      </IconButton>
      <IconButton label="Downloading invoice" variant="secondary" loading>
        <Download aria-hidden="true" />
      </IconButton>
    </div>
  ),
}

export const ExtraSmall: Story = {
  render: () => (
    <div className="flex gap-4">
      {(['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const).map(
        (variant) => (
          <IconButton key={variant} variant={variant} size="icon-xs" label={`Add (${variant})`}>
            <Plus aria-hidden="true" />
          </IconButton>
        ),
      )}
    </div>
  ),
}
