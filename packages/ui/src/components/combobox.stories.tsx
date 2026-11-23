import type { Meta, StoryObj } from '@storybook/react-vite'
import { X } from 'lucide-react'
import * as React from 'react'

import { Button } from './button'
import {
  Combobox,
  ComboboxAction,
  ComboboxAdd,
  ComboboxChip,
  ComboboxChips,
  ComboboxClear,
  ComboboxContent,
  ComboboxControl,
  ComboboxEmpty,
  ComboboxFreeText,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxText,
  ComboboxTrigger,
  ComboboxValue,
} from './combobox'
import docs from './combobox.md?raw'
import { Field, FieldContent, FieldDescription, FieldError, FieldHelp, FieldLabel } from './field'
import { IconButton } from './icon-button'
import { TooltipProvider } from './tooltip'

interface Owner {
  id: string
  label: string
  description?: string
  disabled?: boolean
}
const owners: Owner[] = [
  { id: 'alex', label: 'Alex Morgan', description: 'alex.morgan@acme.com' },
  { id: 'sam', label: 'Sam Rivera', description: 'sam.rivera@acme.com' },
  {
    id: 'taylor',
    label: 'Taylor Anderson with a very long display name',
    description: 'taylor@acme.com',
  },
  { id: 'disabled', label: 'Archived owner', disabled: true },
]
const itemKey = (owner: Owner): string => owner.id
const itemLabel = (owner: Owner): string => owner.label
const sameOwner = (a: Owner, b: Owner): boolean => a.id === b.id
const renderOwner = (owner: Owner): React.ReactElement => (
  <ComboboxItem value={owner} disabled={owner.disabled}>
    <div className="flex">
      <ComboboxText>{owner.label}</ComboboxText>
    </div>
    {owner.description && (
      <div className="v2-text-caption text-text-muted">{owner.description}</div>
    )}
  </ComboboxItem>
)

const meta = {
  title: 'Components/Combobox',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-full max-w-md">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Single({
  disabled = false,
  readOnly = false,
  invalid = false,
  filled = false,
  id,
  describedBy,
}: {
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  filled?: boolean
  id?: string
  describedBy?: string
}): React.ReactElement {
  const [creating, setCreating] = React.useState(false)

  return (
    <Combobox
      items={owners}
      itemToStringLabel={itemLabel}
      isItemEqualToValue={sameOwner}
      defaultValue={filled ? owners[0] : null}
      disabled={disabled}
      readOnly={readOnly}
    >
      <ComboboxControl>
        <ComboboxInput
          id={id}
          aria-label="Quote owner"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          placeholder="Select an owner"
        />
        <ComboboxClear label="Clear owner" />
        <ComboboxTrigger aria-label="Show owners" />
      </ComboboxControl>
      <ComboboxContent>
        <ComboboxEmpty>No owners found</ComboboxEmpty>
        <ComboboxList getItemKey={itemKey}>{renderOwner}</ComboboxList>
        <ComboboxAction onClick={() => setCreating(true)}>
          {creating ? 'Owner creation requested' : 'Create owner'}
        </ComboboxAction>
      </ComboboxContent>
    </Combobox>
  )
}
export const Default: Story = { render: () => <Single /> }
export const States: Story = {
  render: () => (
    <div className="space-y-6">
      {['Empty', 'Filled', 'Disabled', 'Read-only', 'Invalid'].map((state) => (
        <div key={state} className="space-y-2">
          <p className="v2-text-caption">{state}</p>
          <Single
            filled={state !== 'Empty'}
            disabled={state === 'Disabled'}
            readOnly={state === 'Read-only'}
            invalid={state === 'Invalid'}
          />
        </div>
      ))}
    </div>
  ),
}

function MultipleExample({
  above = false,
  disabled = false,
  readOnly = false,
}: {
  above?: boolean
  disabled?: boolean
  readOnly?: boolean
}): React.ReactElement {
  const [value, setValue] = React.useState<Owner[]>(owners.slice(0, 2))
  const chips = (
    <ComboboxChips>
      {value.map((owner) => (
        <ComboboxChip key={owner.id} label={owner.label} removeLabel={`Remove ${owner.label}`} />
      ))}
      {!above && !readOnly && <ComboboxInput aria-label="Quote owners" placeholder="Add owner" />}
    </ComboboxChips>
  )

  return (
    <Combobox
      multiple
      items={owners}
      value={value}
      onValueChange={setValue}
      itemToStringLabel={itemLabel}
      isItemEqualToValue={sameOwner}
      disabled={disabled}
      readOnly={readOnly}
    >
      <div className="flex flex-col gap-2">
        {(above || readOnly) && chips}
        {!readOnly && (
          <ComboboxControl>
            {above ? <ComboboxInput aria-label="Quote owners" placeholder="Add owner" /> : chips}
            <ComboboxTrigger aria-label="Show owners" />
          </ComboboxControl>
        )}
      </div>
      <ComboboxContent>
        <ComboboxEmpty>No owners found</ComboboxEmpty>
        <ComboboxList getItemKey={itemKey}>{renderOwner}</ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
export const ChipsInside: Story = { render: () => <MultipleExample /> }
export const ChipsAbove: Story = { render: () => <MultipleExample above /> }
export const MultipleStates: Story = {
  render: () => (
    <div className="space-y-6">
      <MultipleExample />
      <MultipleExample disabled />
      <MultipleExample readOnly />
      <MultipleExample above />
      <MultipleExample above disabled />
      <MultipleExample above readOnly />
    </div>
  ),
}

function FreeTextExample({ above = false }: { above?: boolean }): React.ReactElement {
  const [value, setValue] = React.useState(['alex@acme.com'])
  const [error, setError] = React.useState<string | null>(null)
  const id = React.useId()
  const chips = (
    <ComboboxChips>
      {value.map((email) => (
        <ComboboxChip key={email} label={email} removeLabel={`Remove ${email}`} />
      ))}
      {!above && <ComboboxInput id={id} aria-describedby={`${id}-help`} placeholder="Add email" />}
    </ComboboxChips>
  )

  return (
    <ComboboxFreeText
      items={['sam@acme.com', 'taylor@acme.com']}
      value={value}
      onValueChange={setValue}
      createItem={(query) => query}
      getItemKey={(email) => email.toLowerCase()}
      normalize={(query) => query.trim().toLowerCase()}
      validate={(query) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query) ? null : 'Enter a valid email address.'
      }
      addLabel={(query) => `Add ${query}`}
      duplicateMessage="This email is already added."
      onValidationChange={setError}
      errorId={`${id}-error`}
    >
      <Field>
        <FieldContent>
          <FieldLabel htmlFor={id}>Recipients</FieldLabel>
          <FieldDescription id={`${id}-help`}>
            Select a suggestion or enter an email and press Enter.
          </FieldDescription>
        </FieldContent>
        <div className="flex flex-col gap-2">
          {above && chips}
          <ComboboxControl>
            {above ? (
              <ComboboxInput id={id} placeholder="Add email" aria-describedby={`${id}-help`} />
            ) : (
              chips
            )}
            <ComboboxTrigger aria-label="Show suggestions" />
          </ComboboxControl>
        </div>
        {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      </Field>
      <ComboboxContent>
        <ComboboxEmpty>No suggestions</ComboboxEmpty>
        <ComboboxList getItemKey={(email: string) => email}>
          {(email) => <ComboboxItem value={email}>{email}</ComboboxItem>}
        </ComboboxList>
        <ComboboxAdd />
      </ComboboxContent>
    </ComboboxFreeText>
  )
}
export const FreeTextInside: Story = { render: () => <FreeTextExample /> }
export const FreeTextAbove: Story = { render: () => <FreeTextExample above /> }
export const WithField: Story = {
  render: () => (
    <div className="space-y-6">
      {['Empty', 'Filled', 'Disabled', 'Read-only', 'Invalid'].map((state) => (
        <Field key={state}>
          <FieldContent>
            <FieldLabel htmlFor={`owner-${state}`}>
              Quote owner · {state}
              <FieldHelp label="About quote owners">
                The owner is responsible for following up on this quote.
              </FieldHelp>
            </FieldLabel>
            <FieldDescription id={`owner-${state}-help`}>
              Who is responsible for this quote?
            </FieldDescription>
          </FieldContent>
          <Single
            id={`owner-${state}`}
            describedBy={`owner-${state}-help${state === 'Invalid' ? ` owner-${state}-error` : ''}`}
            filled={state !== 'Empty'}
            disabled={state === 'Disabled'}
            readOnly={state === 'Read-only'}
            invalid={state === 'Invalid'}
          />
          {state === 'Invalid' && (
            <FieldError id={`owner-${state}-error`}>Choose an available owner.</FieldError>
          )}
        </Field>
      ))}
    </div>
  ),
}

const manyOwners: Owner[] = Array.from({ length: 10000 }, (_, index) => ({
  id: String(index),
  label: `Owner ${String(index).padStart(5, '0')}`,
  description: index % 3 === 0 ? `owner${index}@acme.com` : undefined,
  disabled: index === 2,
}))

export const Virtualised: Story = {
  render: () => (
    <Combobox
      items={manyOwners}
      virtualized
      defaultValue={manyOwners[5000]}
      itemToStringLabel={itemLabel}
      isItemEqualToValue={sameOwner}
    >
      <ComboboxControl>
        <ComboboxInput aria-label="10,000 owners" />
        <ComboboxTrigger aria-label="Show owners" />
      </ComboboxControl>
      <ComboboxContent>
        <ComboboxEmpty>No owners found</ComboboxEmpty>
        <ComboboxList
          getItemKey={itemKey}
          groupBy={(owner: Owner) => `Group ${Math.floor(Number(owner.id) / 100) + 1}`}
          estimateSize={(owner) => (owner.description ? 52 : 36)}
        >
          {renderOwner}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
}
function PopupExample(): React.ReactElement {
  const [query, setQuery] = React.useState('')

  return (
    <Combobox
      items={owners}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={itemLabel}
      isItemEqualToValue={sameOwner}
    >
      <ComboboxTrigger render={<Button variant="secondary" className="w-60" />}>
        <ComboboxValue>{(owner: Owner | null) => owner?.label || 'Assign owner'}</ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxControl>
          <ComboboxInput aria-label="Search owners" placeholder="Search owners" />
          {query && (
            <IconButton
              label="Clear search"
              size="icon-sm"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setQuery('')}
            >
              <X aria-hidden="true" />
            </IconButton>
          )}
        </ComboboxControl>
        <ComboboxEmpty>No owners found</ComboboxEmpty>
        <ComboboxList getItemKey={itemKey}>{renderOwner}</ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
export const Popup: Story = { render: () => <PopupExample /> }

function RemoteExample(): React.ReactElement {
  const [query, setQuery] = React.useState('')
  const [items, setItems] = React.useState(owners)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      setItems(owners.filter((owner) => owner.label.toLowerCase().includes(query.toLowerCase())))
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])
  return (
    <Combobox
      items={items}
      filter={null}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={itemLabel}
      isItemEqualToValue={sameOwner}
      defaultValue={owners[0]}
    >
      <ComboboxControl>
        <ComboboxInput aria-label="Remote owners" placeholder="Search owners" />
        <ComboboxTrigger aria-label="Show owners" />
      </ComboboxControl>
      <ComboboxContent>
        {loading && <ComboboxStatus>Loading owners…</ComboboxStatus>}
        {!loading && <ComboboxEmpty>No owners found</ComboboxEmpty>}
        <ComboboxList getItemKey={itemKey}>{renderOwner}</ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
export const RemoteSearch: Story = { render: () => <RemoteExample /> }

function DialogExample(): React.ReactElement {
  const dialog = React.useRef<HTMLDialogElement>(null)

  return (
    <>
      <Button onClick={() => dialog.current?.showModal()}>Edit quote</Button>
      <dialog
        ref={dialog}
        className="w-96 overflow-visible rounded-xl bg-surface p-6 text-text-default"
      >
        <div className="space-y-4">
          <h2 className="v2-text-label">Quote owners</h2>
          <Combobox items={owners} itemToStringLabel={itemLabel} isItemEqualToValue={sameOwner}>
            <ComboboxControl>
              <ComboboxInput aria-label="Dialog owner" />
              <ComboboxTrigger aria-label="Show owners" />
            </ComboboxControl>
            <ComboboxContent container={dialog}>
              <ComboboxList getItemKey={itemKey}>{renderOwner}</ComboboxList>
            </ComboboxContent>
          </Combobox>
          <Button variant="secondary" onClick={() => dialog.current?.close()}>
            Close
          </Button>
        </div>
      </dialog>
    </>
  )
}
export const InDialog: Story = { render: () => <DialogExample /> }
