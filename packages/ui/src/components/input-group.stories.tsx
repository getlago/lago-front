import type { Meta, StoryObj } from '@storybook/react-vite'
import { Mail, Search } from 'lucide-react'
import { useState } from 'react'

import { Button } from './button'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from './input-group'
import docs from './input-group.md?raw'

const meta = {
  title: 'Components/InputGroup',
  tags: ['autodocs'],
  component: InputGroup,
  parameters: { docs: { description: { component: docs } } },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput aria-label="Website domain" placeholder="example.com" />
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const Compositions: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <InputGroup>
        <InputGroupInput aria-label="Website domain" defaultValue="acme.com" />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Discount percentage" inputMode="decimal" defaultValue="15" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>%</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Payment term in days" inputMode="numeric" defaultValue="30" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>days</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Website subdomain" defaultValue="acme" />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupText>.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput
          type="search"
          aria-label="Search customers"
          placeholder="Find a customer"
        />
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupText>12 results</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput
          type="email"
          aria-label="Email address"
          placeholder="name@company.com"
          autoComplete="email"
        />
        <InputGroupAddon>
          <Mail aria-hidden="true" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {['Empty', 'Filled', 'Disabled', 'Read-only', 'Invalid'].map((state) => (
        <div key={state} className="flex flex-col gap-2">
          <p className="v2-text-caption text-text-muted">{state}</p>
          <InputGroup>
            <InputGroupInput
              aria-label={state}
              placeholder="example.com"
              defaultValue={state === 'Empty' ? undefined : 'acme.com'}
              disabled={state === 'Disabled'}
              readOnly={state === 'Read-only'}
              aria-invalid={state === 'Invalid' || undefined}
            />
            <InputGroupAddon>
              <InputGroupText>https://</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
      ))}
      <p className="v2-text-caption text-text-muted">
        Hover and focus the editable controls to review hover, focus, invalid + hover and invalid +
        focus. Use the toolbar to switch themes.
      </p>
    </div>
  ),
}

export const ControlledAndReset: Story = {
  render: function ControlledExample() {
    const [value, setValue] = useState('acme')

    return (
      <form
        className="flex flex-col gap-4"
        onReset={() => setValue('acme')}
        onSubmit={(event) => event.preventDefault()}
      >
        <InputGroup>
          <InputGroupInput
            aria-label="Controlled domain"
            name="domain"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <InputGroupText>.com</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput aria-label="Uncontrolled term in days" name="term" defaultValue="30" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>days</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <Button type="reset" variant="outline">
          Reset
        </Button>
        <output className="v2-text-body">Domain value: {value}</output>
      </form>
    )
  },
}

export const NarrowWidth: Story = {
  render: () => (
    <div className="w-64 max-w-full">
      <InputGroup>
        <InputGroupInput
          aria-label="Long website domain"
          defaultValue="a-long-company-domain.example.com"
        />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupText>/api</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
}
