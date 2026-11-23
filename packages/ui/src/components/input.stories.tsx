import type { Meta, StoryObj } from '@storybook/react-vite'

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
    <div className="flex flex-col gap-6">
      {['Empty', 'Filled', 'Disabled', 'Read-only', 'Invalid'].map((state) => (
        <div key={state} className="flex flex-col gap-2">
          <p className="v2-text-caption text-text-muted">{state}</p>
          <Input
            aria-label={state}
            placeholder="Enter a name"
            defaultValue={state === 'Empty' ? undefined : 'Acme Corporation'}
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
