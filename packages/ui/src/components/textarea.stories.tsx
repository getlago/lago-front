import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from './button'
import { Field, FieldContent, FieldDescription, FieldLabel } from './field'
import { Textarea } from './textarea'
import docs from './textarea.md?raw'

const longValue =
  'Monthly subscription with priority support, usage-based billing, detailed invoices and a dedicated account manager.\n\nIncludes monthly usage summaries and access to the customer portal.\nRenews each month.'

const meta = {
  title: 'Components/Textarea',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: Textarea,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Field>
      <FieldContent>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <FieldDescription id="description-help">Shown on customer invoices.</FieldDescription>
      </FieldContent>
      <Textarea {...args} id="description" aria-describedby="description-help" />
    </Field>
  ),
  args: { placeholder: 'Enter a description…' },
}

export const ContentGrowth: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="empty-description">Empty · 78px minimum</FieldLabel>
        <Textarea id="empty-description" placeholder="Enter a description…" />
      </Field>
      <Field>
        <FieldLabel htmlFor="short-description">Short · 78px minimum</FieldLabel>
        <Textarea id="short-description" defaultValue="Monthly subscription." />
      </Field>
      <Field>
        <FieldLabel htmlFor="long-description">Long · grows with content</FieldLabel>
        <Textarea id="long-description" defaultValue={longValue} />
      </Field>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {['Empty', 'Filled', 'Disabled', 'Read-only', 'Invalid'].map((state) => (
        <div key={state} className="flex flex-col gap-2">
          <p className="v2-text-caption text-text-muted">{state}</p>
          <Textarea
            aria-label={state}
            placeholder="Enter a description…"
            defaultValue={state === 'Empty' ? undefined : 'Monthly subscription.'}
            disabled={state === 'Disabled'}
            readOnly={state === 'Read-only'}
            aria-invalid={state === 'Invalid' || undefined}
          />
        </div>
      ))}
      <p className="v2-text-caption text-text-muted">
        Hover and focus the editable controls to review hover, focus, invalid + hover and invalid +
        focus. Use the toolbar to switch themes.
      </p>
    </div>
  ),
}

export const Controlled: Story = {
  render: function ControlledExample() {
    const [value, setValue] = useState('')

    return (
      <div className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="controlled-description">Description</FieldLabel>
          <Textarea
            id="controlled-description"
            placeholder="Enter a description…"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setValue(longValue)}>
            Load long text
          </Button>
          <Button type="button" variant="outline" onClick={() => setValue('')}>
            Reset
          </Button>
        </div>
      </div>
    )
  },
}
