import type { Meta, StoryObj } from '@storybook/react-vite'

import { Separator } from './separator'

const meta = {
  title: 'Components/Separator',
  component: Separator,
} satisfies Meta<typeof Separator>

export default meta

type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="v2-text-body space-y-4">
      <p>
        A 1px divider using border-divider. The parent controls spacing and length. Vertical
        separators need a parent with an explicit height. Decorative by default; use
        decorative=false when the separator conveys a meaningful division of content.
      </p>
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
