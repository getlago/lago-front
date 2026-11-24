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
  ComboboxSeparator,
  ComboboxStatus,
  ComboboxText,
  ComboboxTrigger,
  ComboboxValue,
} from './combobox'
import docs from './combobox.md?raw'
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
  longLabel = false,
  empty = false,
  above = false,
  disabled = false,
  readOnly = false,
}: {
  longLabel?: boolean
  empty?: boolean
  above?: boolean
  disabled?: boolean
  readOnly?: boolean
}): React.ReactElement {
  const [value, setValue] = React.useState<Owner[]>(empty ? [] : owners.slice(0, longLabel ? 3 : 2))
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

function FreeTextExample({
  above = false,
  empty = false,
}: {
  above?: boolean
  empty?: boolean
}): React.ReactElement {
  const [value, setValue] = React.useState<string[]>(empty ? [] : ['Priority', 'alex@acme.com'])
  const [query, setQuery] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const id = React.useId()
  const input = (
    <ComboboxInput
      aria-label="Values"
      aria-invalid={!!error || undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      placeholder="Add a value"
    />
  )
  const chips = (
    <ComboboxChips>
      {value.map((item) => (
        <ComboboxChip key={item} label={item} removeLabel={`Remove ${item}`} />
      ))}
      {!above && input}
    </ComboboxChips>
  )

  return (
    <ComboboxFreeText
      value={value}
      onValueChange={setValue}
      inputValue={query}
      onInputValueChange={setQuery}
      createItem={(text) => text}
      getItemKey={(text) => text}
      addLabel={(text) => `Add ${text}`}
      validate={(candidate, selected) =>
        selected.includes(candidate) ? 'This value is already added.' : null
      }
      onValidationChange={setError}
    >
      <div className="flex flex-col gap-2">
        {above && chips}
        <ComboboxControl>{above ? input : chips}</ComboboxControl>
        {error && (
          <p id={`${id}-error`} className="v2-text-caption text-danger-foreground">
            {error}
          </p>
        )}
      </div>
      {!!query.trim() && !value.includes(query.trim()) && !error && (
        <ComboboxContent>
          <ComboboxAdd />
        </ComboboxContent>
      )}
    </ComboboxFreeText>
  )
}
export const FreeTextInside: Story = { render: () => <FreeTextExample /> }
export const FreeTextAbove: Story = { render: () => <FreeTextExample above /> }

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
              size="icon-xs"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setQuery('')}
            >
              <X aria-hidden="true" />
            </IconButton>
          )}
        </ComboboxControl>
        <ComboboxSeparator />
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
      <ComboboxContent aria-busy={loading || undefined}>
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

function MenuStateExample({ loading }: { loading: boolean }): React.ReactElement {
  return (
    <Combobox items={[]} defaultOpen>
      <ComboboxControl>
        <ComboboxInput aria-label="Quote owner" placeholder="Select an owner" />
        <ComboboxTrigger aria-label="Show owners" />
      </ComboboxControl>
      <ComboboxContent aria-busy={loading || undefined}>
        {loading ? (
          <ComboboxStatus>Loading owners…</ComboboxStatus>
        ) : (
          <ComboboxEmpty>No owners found</ComboboxEmpty>
        )}
        <ComboboxList getItemKey={(owner: string) => owner}>
          {(owner) => <ComboboxItem value={owner}>{owner}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
export const Loading: Story = { render: () => <MenuStateExample loading /> }
export const Empty: Story = { render: () => <MenuStateExample loading={false} /> }

export const ChipsInsideEmpty: Story = { render: () => <MultipleExample empty /> }
export const FreeTextInsideEmpty: Story = { render: () => <FreeTextExample empty /> }

export const ResizableChips: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="v2-text-caption text-text-subtle">
        Drag the lower-right corner to check truncation and expansion.
      </p>
      <div
        role="group"
        aria-label="Resizable owners"
        className="w-80 min-w-60 max-w-full resize-x overflow-auto p-1"
      >
        <MultipleExample longLabel />
      </div>
    </div>
  ),
}
