import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import { RadioGroup, RadioGroupItem } from './radio-group'
import docs from './radio-group.md?raw'

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <RadioGroup aria-label="Collection" defaultValue="automatic">
      <RadioGroupItem value="automatic" aria-label="Automatic" />
      <RadioGroupItem value="manual" aria-label="Manual" />
    </RadioGroup>
  ),
}
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {['Default', 'Invalid', 'Disabled', 'Read-only'].map((state) => (
        <div key={state} className="flex items-center gap-8">
          <span className="v2-text-caption w-20 text-text-muted">{state}</span>
          <RadioGroup
            aria-label={state}
            defaultValue="selected"
            disabled={state === 'Disabled'}
            readOnly={state === 'Read-only'}
            className="flex-row gap-8"
          >
            <RadioGroupItem
              value="unselected"
              aria-label={`${state} unselected`}
              aria-invalid={state === 'Invalid' || undefined}
            />
            <RadioGroupItem
              value="selected"
              aria-label={`${state} selected`}
              aria-invalid={state === 'Invalid' || undefined}
            />
          </RadioGroup>
        </div>
      ))}
      <p className="v2-text-caption text-text-muted">
        Hover and Tab to focus; arrows select an option. Field compositions live under Field.
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
          <RadioGroup name="collection" defaultValue="automatic" aria-label="Collection">
            <RadioGroupItem value="automatic" aria-label="Automatic" />
            <RadioGroupItem value="manual" aria-label="Manual" />
          </RadioGroup>
          <Button type="reset">Reset</Button>
        </form>
      ))}
    </div>
  ),
}
