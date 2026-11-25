import type { Meta, StoryObj } from '@storybook/react-vite'

import { Checkbox } from './checkbox'
import docs from './checkbox.md?raw'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { 'aria-label': 'Email notifications' } }
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {['Default', 'Invalid', 'Disabled', 'Read-only'].map((state) => (
        <div key={state} className="flex items-center gap-8">
          <span className="v2-text-caption w-20 text-text-muted">{state}</span>
          {['Unchecked', 'Checked', 'Indeterminate'].map((value) => (
            <Checkbox
              key={value}
              aria-label={`${state} ${value}`}
              defaultChecked={value === 'Checked'}
              indeterminate={value === 'Indeterminate'}
              disabled={state === 'Disabled'}
              readOnly={state === 'Read-only'}
              aria-invalid={state === 'Invalid' || undefined}
            />
          ))}
        </div>
      ))}
      <p className="v2-text-caption text-text-muted">
        Columns: unchecked, checked, indeterminate. Hover or Tab to focus; switch themes in the
        toolbar. Field compositions live under Field.
      </p>
    </div>
  ),
}
