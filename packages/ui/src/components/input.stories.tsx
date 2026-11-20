import type { Meta, StoryObj } from '@storybook/react-vite'

import { Field, FieldContent, FieldError, FieldLabel } from './field'
import { Input, PasswordInput, SearchInput } from './input'
import docs from './input.md?raw'

const meta = {
  title: 'Components/Input',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: Input,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>
export const Default: Story = {
  args: { 'aria-label': 'Customer name', placeholder: 'Enter a name' },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Input aria-label="Empty" placeholder="Enter a name" />
      <Input aria-label="Filled" defaultValue="Acme Corporation" />
      <Input aria-label="Disabled" defaultValue="Acme Corporation" disabled />
      <Input aria-label="Read-only" defaultValue="Acme Corporation" readOnly />
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="invalid-name">Customer name</FieldLabel>
        </FieldContent>
        <Input
          id="invalid-name"
          aria-invalid
          aria-describedby="invalid-name-error"
          defaultValue="Acme Corporation"
        />
        <FieldError id="invalid-name-error">Please enter a valid value.</FieldError>
      </Field>
      <p className="v2-text-caption text-text-muted">
        Hover or focus any editable input to review its interactive states, including invalid +
        focus.
      </p>
    </div>
  ),
}
export const Search: Story = {
  render: () => <SearchInput aria-label="Search customers" placeholder="Search customers" />,
}
export const Password: Story = {
  render: () => (
    <PasswordInput
      aria-label="Password"
      defaultValue="ExamplePassword"
      showPasswordLabel="Show password"
      hidePasswordLabel="Hide password"
      autoComplete="new-password"
    />
  ),
}
export const Borderless: Story = {
  render: () => (
    <table className="w-full border-collapse text-left">
      <caption className="v2-text-label mb-4 text-left">Usage thresholds</caption>
      <thead>
        <tr>
          <th id="threshold-label" className="v2-text-label border border-border-divider p-3">
            Threshold
          </th>
        </tr>
      </thead>
      <tbody>
        {['Included usage', 'Additional usage'].map((value, index) => (
          <tr key={value}>
            <td className="border border-border-divider p-0">
              <Input
                className="block"
                variant="borderless"
                aria-label={`Threshold ${index + 1}`}
                defaultValue={value}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}
