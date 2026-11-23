import type { Meta, StoryObj } from '@storybook/react-vite'

import { NumericBadge } from './numeric-badge'
import docs from './numeric-badge.md?raw'

const meta = {
  title: 'Components/NumericBadge',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: NumericBadge,
  args: { value: 12 },
} satisfies Meta<typeof NumericBadge>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <NumericBadge value={12} />
      <NumericBadge value={12} selected />
      <NumericBadge value={12} disabled />
      <NumericBadge value={0} />
      <NumericBadge value="99+" />
    </div>
  ),
}
