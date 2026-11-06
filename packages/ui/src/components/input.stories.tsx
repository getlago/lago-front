import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './input'

const meta = {
  title: 'Components/Input',
  component: Input,
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { 'aria-label': 'Default input', placeholder: 'Placeholder' },
}

export const NumericAndFile: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      <label className="v2-text-label" htmlFor="v2-number-input">
        Numeric override
      </label>
      <Input id="v2-number-input" className="v2-text-number" defaultValue="1234.00" />
      <label className="v2-text-label" htmlFor="v2-file-input">
        File input
      </label>
      <Input id="v2-file-input" type="file" />
    </div>
  ),
}
