import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import docs from './tooltip.md?raw'

const meta = {
  title: 'Components/Tooltip',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>

export default meta

type Story = StoryObj<typeof meta>

export const Placements: Story = {
  render: () => (
    <div className="space-y-6 p-12">
      <p className="v2-text-body">
        First hover: 300ms. Move between triggers within 500ms: instant. Keyboard focus: instant.
        Escape dismisses. Keep the pointer over the tooltip to keep it open.
      </p>
      <div className="flex flex-wrap gap-6">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger asChild>
              <Button variant="outline">{side} placement</Button>
            </TooltipTrigger>
            <TooltipContent side={side}>Tooltip on the {side}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  ),
}

export const Paragraph: Story = {
  render: () => (
    <div className="space-y-6 p-12">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary">Paragraph example</Button>
        </TooltipTrigger>
        <TooltipContent>
          Add a new customer to your organization. You can edit their billing details later.
        </TooltipContent>
      </Tooltip>
      <p className="v2-text-caption">
        Maximum width 240px, left-aligned text, 12px horizontal / 8px vertical padding. Resize the
        window to check collision handling.
      </p>
    </div>
  ),
}
