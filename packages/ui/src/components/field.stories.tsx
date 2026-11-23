import type { Meta, StoryObj } from '@storybook/react-vite'
import { Mail } from 'lucide-react'
import { type ReactElement, useId } from 'react'

import { Badge } from './badge'
import { Combobox } from './combobox'
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
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group'
import { Textarea } from './textarea'
import { TooltipProvider } from './tooltip'

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
      <Field>
        <FieldContent>
          <FieldLabel htmlFor={`${id}-code`}>Code</FieldLabel>
          <FieldDescription>Choose a unique code.</FieldDescription>
        </FieldContent>
        <Input
          id={`${id}-code`}
          aria-invalid
          aria-describedby={`${id}-error`}
          defaultValue="existing_code"
        />
        <FieldError id={`${id}-error`}>This code is already in use.</FieldError>
      </Field>
    </FieldGroup>
  )
}

export const Default: Story = { render: () => <ProfileFields /> }

export const Disabled: Story = {
  render: () => (
    <Field data-disabled>
      <FieldContent>
        <FieldLabel htmlFor="disabled-name">Display name</FieldLabel>
        <FieldDescription id="disabled-description">
          The name displayed on invoices.
        </FieldDescription>
      </FieldContent>
      <Input
        id="disabled-name"
        disabled
        aria-describedby="disabled-description"
        defaultValue="Acme Corporation"
      />
    </Field>
  ),
}

const FieldStates = ({
  control,
}: {
  control: 'input' | 'input-group' | 'textarea'
}): ReactElement => {
  const id = useId()
  const { label, description, value } = {
    input: {
      label: 'Customer name',
      description: 'Shown on customer invoices.',
      value: 'Acme Corporation',
    },
    'input-group': {
      label: 'Email address',
      description: 'Where we send billing notifications.',
      value: 'billing@acme.com',
    },
    textarea: {
      label: 'Description',
      description: 'Shown on customer invoices.',
      value: 'Monthly subscription.',
    },
  }[control]

  return (
    <div className="flex max-w-md flex-col gap-6">
      {['Empty', 'Filled', 'Disabled', 'Read-only', 'Invalid'].map((state) => {
        const controlId = `${id}-${state}`
        const invalid = state === 'Invalid'
        const controlProps = {
          id: controlId,
          placeholder: `Enter ${label.toLowerCase()}`,
          defaultValue: state === 'Empty' ? undefined : value,
          disabled: state === 'Disabled',
          readOnly: state === 'Read-only',
          'aria-invalid': invalid || undefined,
          'aria-describedby': `${controlId}-description${invalid ? ` ${controlId}-error` : ''}`,
        } as const

        const renderControl = (): ReactElement => {
          if (control === 'input') return <Input {...controlProps} />
          if (control === 'textarea') return <Textarea {...controlProps} />

          return (
            <InputGroup>
              <InputGroupInput {...controlProps} type="email" autoComplete="email" />
              <InputGroupAddon>
                <Mail aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
          )
        }

        return (
          <div key={state} className="flex flex-col gap-2">
            <p className="v2-text-caption text-text-muted">{state}</p>
            <Field data-disabled={controlProps.disabled || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
                <FieldDescription id={`${controlId}-description`}>{description}</FieldDescription>
              </FieldContent>
              {renderControl()}
              {invalid && (
                <FieldError id={`${controlId}-error`}>
                  Please enter a valid {label.toLowerCase()}.
                </FieldError>
              )}
            </Field>
          </div>
        )
      })}
      <p className="v2-text-caption text-text-muted">
        Hover and focus the editable controls to review hover, focus, invalid + hover and invalid +
        focus. Use the toolbar to switch themes.
      </p>
    </div>
  )
}

export const WithInput: Story = { render: () => <FieldStates control="input" /> }
export const WithInputGroup: Story = { render: () => <FieldStates control="input-group" /> }
export const WithTextarea: Story = { render: () => <FieldStates control="textarea" /> }

const ComboboxFields = ({ placement }: { placement?: 'inside' | 'above' }): ReactElement => {
  const id = useId()

  return (
    <div className="flex max-w-md flex-col gap-6">
      {['Empty', 'Filled', 'Disabled', 'Read-only', 'Invalid'].map((state) => {
        const controlId = `${id}-${state}`
        const invalid = state === 'Invalid'
        const common = {
          id: controlId,
          options: [
            { value: 'alex', label: 'Alex Morgan' },
            { value: 'sam', label: 'Sam Rivera' },
          ],
          placeholder: 'Select quote owners',
          searchLabel: 'Search owners',
          clearSearchLabel: 'Clear search',
          emptyText: 'No owners found',
          loadingText: 'Loading owners…',
          disabled: state === 'Disabled',
          readOnly: state === 'Read-only',
          'aria-invalid': invalid,
          'aria-labelledby': `${controlId}-label`,
          'aria-describedby': `${controlId}-description${invalid ? ` ${controlId}-error` : ''}`,
        }

        return (
          <div key={state} className="space-y-2">
            <p className="v2-text-caption text-text-muted">{state}</p>
            <Field data-disabled={common.disabled || undefined}>
              <FieldContent>
                <div className="flex items-center gap-1">
                  <FieldLabel id={`${controlId}-label`} htmlFor={controlId}>
                    Quote owners
                  </FieldLabel>
                  <FieldHelp label="About quote owners">Owners can manage this quote.</FieldHelp>
                </div>
                <FieldDescription id={`${controlId}-description`}>
                  Choose who manages this quote.
                </FieldDescription>
              </FieldContent>
              {placement ? (
                <Combobox
                  {...common}
                  multiple
                  placement={placement}
                  chipsLabel="Quote owners"
                  removeLabel={(label) => `Remove ${label}`}
                  defaultValue={state === 'Empty' ? [] : ['alex', 'sam']}
                />
              ) : (
                <Combobox {...common} defaultValue={state === 'Empty' ? null : 'alex'} />
              )}
              {invalid && (
                <FieldError id={`${controlId}-error`}>Select an active quote owner.</FieldError>
              )}
            </Field>
          </div>
        )
      })}
    </div>
  )
}

export const WithCombobox: Story = { render: () => <ComboboxFields /> }
export const WithComboboxChipsInside: Story = {
  render: () => <ComboboxFields placement="inside" />,
}
export const WithComboboxChipsAbove: Story = { render: () => <ComboboxFields placement="above" /> }
