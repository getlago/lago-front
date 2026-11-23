import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactElement, useRef, useState } from 'react'

import { Button } from './button'
import { Combobox, type ComboboxOption } from './combobox'
import docs from './combobox.md?raw'
import { TooltipProvider } from './tooltip'

const owners: ComboboxOption[] = [
  { value: 'alex', label: 'Alex Morgan', description: 'alex@acme.com', group: 'Sales' },
  { value: 'sam', label: 'Sam Rivera', description: 'sam@acme.com', group: 'Sales' },
  { value: 'jamie', label: 'Jamie Chen', description: 'jamie@acme.com', group: 'Finance' },
  { value: 'inactive', label: 'Inactive owner', disabled: true, group: 'Finance' },
]
const labels = {
  placeholder: 'Select quote owners',
  searchLabel: 'Search owners',
  clearSearchLabel: 'Clear search',
  emptyText: 'No owners found',
  loadingText: 'Loading owners…',
}
const multiLabels = {
  chipsLabel: 'Quote owners',
  removeLabel: (label: string): string => `Remove ${label}`,
}
const meta = {
  title: 'Components/Combobox',
  component: Combobox,
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
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj
export const Default: Story = {
  render: () => <Combobox {...labels} options={owners} aria-label="Quote owner" />,
}

const StatesExample = ({ placement }: { placement?: 'inside' | 'above' }): ReactElement => (
  <div className="flex flex-col gap-6">
    {['Empty', 'Filled', 'Disabled', 'Read-only', 'Invalid'].map((state) => {
      const common = {
        ...labels,
        options: owners,
        'aria-label': `${state} quote owners`,
        disabled: state === 'Disabled',
        readOnly: state === 'Read-only',
        'aria-invalid': state === 'Invalid',
      }

      return (
        <div key={state} className="space-y-2">
          <p className="v2-text-caption text-text-muted">{state}</p>
          {placement ? (
            <Combobox
              {...common}
              {...multiLabels}
              multiple
              placement={placement}
              defaultValue={state === 'Empty' ? [] : ['alex', 'sam']}
            />
          ) : (
            <Combobox {...common} defaultValue={state === 'Empty' ? null : 'alex'} />
          )}
        </div>
      )
    })}
    <p className="v2-text-caption text-text-muted">
      Hover, focus and open the editable controls. Switch themes with the toolbar.
    </p>
  </div>
)

export const States: Story = { render: () => <StatesExample /> }
export const ChipsInside: Story = { render: () => <StatesExample placement="inside" /> }
export const ChipsAbove: Story = { render: () => <StatesExample placement="above" /> }
export const LabelOnly: Story = {
  render: () => (
    <Combobox
      {...labels}
      options={owners.map(({ value, label }) => ({ value, label }))}
      aria-label="Quote owner"
    />
  ),
}
export const WithCreation: Story = {
  render: function CreationExample() {
    const [created, setCreated] = useState(false)

    return (
      <div className="space-y-4">
        <Combobox
          {...labels}
          options={Array.from({ length: 50 }, (_, index) => ({
            value: String(index),
            label: `Quote owner ${index + 1}`,
          }))}
          aria-label="Quote owner"
          createAction={{ label: 'Create owner', onClick: () => setCreated(true) }}
        />
        {created && <p role="status">Create owner action called.</p>}
      </div>
    )
  },
}
export const MenuStates: Story = {
  render: () => (
    <div className="space-y-6">
      <Combobox {...labels} options={[]} aria-label="Empty results" />
      <Combobox {...labels} options={owners} loading aria-label="Loading results" />
      <Combobox
        {...labels}
        options={owners}
        errorText="Unable to load owners. Try again."
        aria-label="Failed results"
      />
    </div>
  ),
}
const RemoteExample = (): ReactElement => {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>(['alex'])
  const results = owners.filter((owner) => owner.label?.toLowerCase().includes(query.toLowerCase()))

  return (
    <Combobox
      {...labels}
      {...multiLabels}
      multiple
      aria-label="Remote quote owners"
      value={selected}
      onValueChange={setSelected}
      filter="server"
      query={query}
      onQueryChange={setQuery}
      options={results}
      selectedOptions={owners}
    />
  )
}

export const RemoteResults: Story = { render: () => <RemoteExample /> }
const longOwners = [
  { value: 'long', label: 'Alexandra Montgomery — Enterprise Accounts — 12345' },
  ...owners,
]

export const Truncation: Story = {
  render: () => (
    <div className="flex w-60 max-w-full resize-x flex-col gap-6 overflow-auto p-1">
      <Combobox {...labels} options={longOwners} defaultValue="long" aria-label="Long owner" />
      <Combobox
        {...labels}
        {...multiLabels}
        options={longOwners}
        multiple
        defaultValue={['long', 'sam']}
        aria-label="Long chips inside"
      />
      <Combobox
        {...labels}
        {...multiLabels}
        options={longOwners}
        multiple
        placement="above"
        defaultValue={['long', 'sam']}
        aria-label="Long chips above"
      />
      <Combobox
        {...labels}
        {...multiLabels}
        options={longOwners}
        multiple
        readOnly
        defaultValue={['long']}
        aria-label="Read-only long owner"
      />
    </div>
  ),
}
const DialogExample = (): ReactElement => {
  const dialog = useRef<HTMLDialogElement>(null)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  return (
    <>
      <Button onClick={() => dialog.current?.showModal()}>Edit quote owners</Button>
      <dialog
        ref={dialog}
        className="w-96 max-w-full overflow-visible rounded-xl bg-surface p-6 text-text-default"
        aria-label="Quote owners"
      >
        <div ref={setContainer} className="space-y-4">
          <Combobox
            {...labels}
            {...multiLabels}
            options={owners}
            multiple
            aria-label="Quote owners"
            portalContainer={container}
          />
          <Button variant="secondary" onClick={() => dialog.current?.close()}>
            Done
          </Button>
        </div>
      </dialog>
    </>
  )
}

export const InDialog: Story = { render: () => <DialogExample /> }
