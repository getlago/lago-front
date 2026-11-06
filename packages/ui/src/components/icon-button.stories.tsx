import type { Meta, StoryObj } from '@storybook/react-vite'
import { Copy, Download, Plus } from 'lucide-react'

import { IconButton } from './icon-button'
import docs from './icon-button.md?raw'
import { TooltipProvider } from './tooltip'

const actions = [
  { label: 'Add customer', icon: Plus },
  { label: 'Copy invoice number', icon: Copy },
  { label: 'Download invoice', icon: Download },
]

const meta = {
  title: 'Components/IconButton',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: IconButton,
  args: {
    label: 'Copy invoice number',
    variant: 'secondary',
    children: <Copy aria-hidden="true" />,
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
    <div className="space-y-4">
      <div className="flex gap-4" role="group" aria-label="Icon actions">
        {actions.map(({ label, icon: Icon }, index) => (
          <IconButton
            key={label}
            label={label}
            variant="secondary"
            size={(['icon-sm', 'icon', 'icon-lg'] as const)[index]}
          >
            <Icon aria-hidden="true" />
          </IconButton>
        ))}
      </div>
      <p className="v2-text-caption">
        IconButton: small 32px, default 36px, large 40px. Icons remain 14px.
      </p>
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
