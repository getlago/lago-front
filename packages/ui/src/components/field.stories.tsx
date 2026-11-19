import type { Meta, StoryObj } from '@storybook/react-vite'
import { useId } from 'react'

import { Badge } from './badge'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldHelp,
  FieldLabel,
} from './field'
import docs from './field.md?raw'
import { Input, PasswordInput, SearchInput } from './input'
import { TooltipProvider } from './tooltip'

import { AddableExample } from '../stories/addable-field-example'

const meta = {
  title: 'Components/Field',
  component: Field,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="max-w-2xl">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Field>

export default meta

type Story = StoryObj<typeof meta>

const ProfileFields = () => {
  const id = useId()

  return (
    <FieldGroup>
      <Field>
        <FieldContent>
          <div className="flex items-center gap-1">
            <FieldLabel htmlFor={`${id}-name`}>
              Display name{' '}
              <span aria-hidden="true" className="text-danger-foreground">
                *
              </span>
            </FieldLabel>
            <FieldHelp label="About display name">The name displayed on invoices.</FieldHelp>
          </div>
          <FieldDescription id={`${id}-description`}>
            Use a name your customers recognize.
          </FieldDescription>
        </FieldContent>
        <Input
          id={`${id}-name`}
          required
          autoComplete="organization"
          aria-describedby={`${id}-description`}
          placeholder="Acme Corporation"
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldContent>
            <div className="flex items-center gap-1">
              <FieldLabel htmlFor={`${id}-search`}>Search customers</FieldLabel>
              <Badge size="sm">Optional</Badge>
            </div>
          </FieldContent>
          <SearchInput id={`${id}-search`} placeholder="Search by name" />
        </Field>
        <Field>
          <FieldContent>
            <FieldLabel htmlFor={`${id}-password`}>Password</FieldLabel>
          </FieldContent>
          <PasswordInput
            id={`${id}-password`}
            autoComplete="new-password"
            showPasswordLabel="Show password"
            hidePasswordLabel="Hide password"
          />
        </Field>
      </div>
      <Field data-invalid="true">
        <FieldContent>
          <FieldLabel htmlFor={`${id}-code`}>Code</FieldLabel>
          <FieldDescription>Choose a unique code.</FieldDescription>
        </FieldContent>
        <div className="flex flex-col gap-1">
          <Input
            id={`${id}-code`}
            aria-invalid
            aria-describedby={`${id}-error`}
            defaultValue="existing_code"
          />
          <FieldError id={`${id}-error`}>This code is already in use.</FieldError>
        </div>
      </Field>
    </FieldGroup>
  )
}

export const Default: Story = { render: () => <ProfileFields /> }

export const Addable: Story = { render: () => <AddableExample /> }
export const Disabled: Story = { render: () => <AddableExample disabled /> }
