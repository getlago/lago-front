import type { Meta, StoryObj } from '@storybook/react-vite'

import { Separator } from './separator'
import docs from './separator.md?raw'

const meta = {
  title: 'Components/Separator',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: Separator,
} satisfies Meta<typeof Separator>

export default meta

type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="v2-text-body space-y-4">
      <p>Account details</p>
      <Separator decorative={false} />
      <p>Billing details</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="v2-text-body flex h-10 items-center gap-4">
      <span>Details</span>
      <Separator orientation="vertical" />
      <span>Activity</span>
    </div>
  ),
}
