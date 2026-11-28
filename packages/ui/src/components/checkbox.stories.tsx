import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
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

export const FormReset: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {[false, true].map((cancelReset) => (
        <form
          key={String(cancelReset)}
          aria-label={cancelReset ? 'Canceled reset' : 'Normal reset'}
          className="flex flex-col items-start gap-4"
          onReset={(event) => {
            if (cancelReset) event.preventDefault()
          }}
        >
          <p className="v2-text-caption text-text-muted">
            {cancelReset
              ? 'Change the selection, then reset: your selection is preserved.'
              : 'Change the selection, then reset: the default is restored.'}
          </p>
          <Checkbox name="email" value="enabled" aria-label="Email notifications" defaultChecked />
          <Button type="reset">Reset</Button>
        </form>
      ))}
    </div>
  ),
}
