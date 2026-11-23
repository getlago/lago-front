import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'

import {
  Combobox,
  ComboboxAdd,
  ComboboxChip,
  ComboboxChips,
  ComboboxContent,
  ComboboxControl,
  ComboboxFreeText,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '../combobox'
import { TooltipProvider } from '../tooltip'

function FreeText({ above = false }: { above?: boolean }): React.ReactElement {
  const [value, setValue] = React.useState(['alex@example.com'])
  const [error, setError] = React.useState<string | null>(null)
  const chips = (
    <ComboboxChips>
      {value.map((email) => (
        <ComboboxChip key={email} label={email} removeLabel={`Remove ${email}`} />
      ))}
      {!above && <ComboboxInput aria-label="Recipients" />}
    </ComboboxChips>
  )

  return (
    <TooltipProvider>
      <ComboboxFreeText
        items={['sam@example.com']}
        value={value}
        onValueChange={setValue}
        createItem={(query) => query}
        getItemKey={(email) => email.toLowerCase()}
        normalize={(query) => query.trim().toLowerCase()}
        validate={(query) => (query.includes('@') ? null : 'Invalid email')}
        duplicateMessage="Duplicate email"
        addLabel={(query) => `Add ${query}`}
        onValidationChange={setError}
        errorId="error"
      >
        {above && chips}
        <ComboboxControl>
          {above ? <ComboboxInput aria-label="Recipients" /> : chips}
        </ComboboxControl>
        <p id="error">{error}</p>
        <output aria-label="Selected">{value.join(',')}</output>
        <ComboboxContent>
          <ComboboxList getItemKey={(email: string) => email}>
            {(email) => <ComboboxItem value={email}>{email}</ComboboxItem>}
          </ComboboxList>
          <ComboboxAdd />
        </ComboboxContent>
      </ComboboxFreeText>
      <button>Next</button>
    </TooltipProvider>
  )
}

beforeAll(() => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null)
  Element.prototype.scrollIntoView = jest.fn()
})
afterAll(() => jest.restoreAllMocks())

describe.each([false, true])('free text above=%s', (above) => {
  it('commits normalized values, rejects duplicates and keeps invalid text editable', async () => {
    const user = userEvent.setup()

    render(<FreeText above={above} />)
    const input = screen.getByRole('combobox')

    await user.type(input, 'NEW@example.com{Enter}')
    expect(screen.getByLabelText('Selected')).toHaveTextContent('alex@example.com,new@example.com')
    expect(input).toHaveValue('')
    await user.type(input, 'NEW@example.com{Enter}')
    expect(screen.getByText('Duplicate email')).toBeInTheDocument()
    expect(input).toHaveValue('NEW@example.com')
    await user.clear(input)
    await user.type(input, 'invalid{Enter}')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'error')
    expect(input).toHaveValue('invalid')
  })
  it('does not commit on blur, Tab or during IME composition', async () => {
    const user = userEvent.setup()

    render(<FreeText above={above} />)
    const input = screen.getByRole('combobox')

    await user.type(input, 'new@example.com')
    fireEvent.compositionStart(input)
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 })
    expect(screen.getByLabelText('Selected')).toHaveTextContent(/^alex@example.com$/)
    fireEvent.compositionEnd(input)
    await user.tab()
    expect(input).toHaveValue('new@example.com')
    expect(screen.getByLabelText('Selected')).toHaveTextContent(/^alex@example.com$/)
  })
  it('selects suggestions, stays open, then removes the correct chip', async () => {
    const user = userEvent.setup()

    render(<FreeText above={above} />)
    const input = screen.getByRole('combobox')

    await user.type(input, 'sam')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByLabelText('Selected')).toHaveTextContent('alex@example.com,sam@example.com')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveValue('')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Remove alex@example.com' }))
    expect(screen.getByLabelText('Selected')).toHaveTextContent(/^sam@example.com$/)
  })
  it('commits through the explicit Add action', async () => {
    const user = userEvent.setup()

    render(<FreeText above={above} />)
    await user.type(screen.getByRole('combobox'), 'new@example.com')
    await user.click(screen.getByRole('button', { name: 'Add new@example.com' }))
    expect(screen.getByLabelText('Selected')).toHaveTextContent('new@example.com')
  })
})

it('selection-only input cannot create arbitrary values', async () => {
  const user = userEvent.setup()
  const changed = jest.fn()

  render(
    <Combobox items={['Alex', 'Sam']} onValueChange={changed}>
      <ComboboxControl>
        <ComboboxInput aria-label="Owner" />
        <ComboboxTrigger aria-label="Show owners" />
      </ComboboxControl>
      <ComboboxContent>
        <ComboboxList getItemKey={(name: string) => name}>
          {(name) => <ComboboxItem value={name}>{name}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  )
  await user.type(screen.getByRole('combobox'), 'Unknown{Enter}')
  expect(changed).not.toHaveBeenCalled()
})

it('keeps selected values when remote results change', async () => {
  const user = userEvent.setup()

  function Remote(): React.ReactElement {
    const [items, setItems] = React.useState(['Alex', 'Sam'])

    return (
      <Combobox items={items} defaultValue="Alex">
        <ComboboxControl>
          <ComboboxInput aria-label="Owner" />
        </ComboboxControl>
        <button onClick={() => setItems(['Taylor'])}>Refresh</button>
        <ComboboxContent>
          <ComboboxList getItemKey={(name: string) => name}>
            {(name) => <ComboboxItem value={name}>{name}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    )
  }
  render(<Remote />)
  await user.click(screen.getByRole('button', { name: 'Refresh' }))
  await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('Alex'))
})

it('does not erase chips when Escape is pressed with the popup closed', async () => {
  const user = userEvent.setup()

  render(<FreeText />)
  await user.click(screen.getByRole('combobox'))
  await user.keyboard('{Escape}{Escape}')
  expect(screen.getByLabelText('Selected')).toHaveTextContent(/^alex@example.com$/)
})

it('does not submit the form when committing free text', async () => {
  const user = userEvent.setup()
  const submit = jest.fn((event: React.FormEvent) => event.preventDefault())

  render(
    <form onSubmit={submit}>
      <FreeText />
    </form>,
  )
  await user.type(screen.getByRole('combobox'), 'new@example.com{Enter}')
  expect(submit).not.toHaveBeenCalled()
  expect(screen.getByLabelText('Selected')).toHaveTextContent('new@example.com')
})

it('exposes the free-text query for remote search and resets it after commit', async () => {
  const user = userEvent.setup()
  const changed = jest.fn()

  function RemoteFreeText(): React.ReactElement {
    const [query, setQuery] = React.useState('')
    const [value, setValue] = React.useState<string[]>([])

    return (
      <ComboboxFreeText
        value={value}
        onValueChange={setValue}
        inputValue={query}
        onInputValueChange={(next) => {
          changed(next)
          setQuery(next)
        }}
        items={[]}
        filter={null}
        createItem={(text) => text}
        getItemKey={(text) => text}
        validate={() => null}
        duplicateMessage="Duplicate"
        addLabel={(text) => `Add ${text}`}
      >
        <ComboboxControl>
          <ComboboxInput aria-label="Tags" />
        </ComboboxControl>
        <output aria-label="Tags value">{value.join(',')}</output>
      </ComboboxFreeText>
    )
  }
  render(<RemoteFreeText />)
  await user.type(screen.getByRole('combobox'), 'new-tag{Enter}')
  expect(changed).toHaveBeenCalledWith('new-tag')
  expect(changed).toHaveBeenLastCalledWith('')
  expect(screen.getByLabelText('Tags value')).toHaveTextContent('new-tag')
})

it('keeps a controlled multiple popup open and clears its controlled query on selection', async () => {
  const user = userEvent.setup()

  function ControlledMultiple(): React.ReactElement {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')

    return (
      <Combobox
        multiple
        items={['Alex', 'Sam']}
        open={open}
        onOpenChange={setOpen}
        inputValue={query}
        onInputValueChange={setQuery}
      >
        <ComboboxControl>
          <ComboboxInput aria-label="Owners" />
        </ComboboxControl>
        <ComboboxContent>
          <ComboboxList getItemKey={(name: string) => name}>
            {(name) => <ComboboxItem value={name}>{name}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    )
  }
  render(<ControlledMultiple />)
  const input = screen.getByRole('combobox')

  await user.type(input, 'Sam')
  await user.click(screen.getByRole('option', { name: 'Sam' }))
  expect(input).toHaveAttribute('aria-expanded', 'true')
  expect(input).toHaveValue('')
})

it('does not select a highlighted suggestion during IME composition', async () => {
  const user = userEvent.setup()

  render(<FreeText />)
  const input = screen.getByRole('combobox')

  await user.type(input, 'sam')
  await user.keyboard('{ArrowDown}')
  fireEvent.compositionStart(input)
  fireEvent.keyDown(input, {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    isComposing: true,
  })
  expect(screen.getByLabelText('Selected')).toHaveTextContent(/^alex@example.com$/)
  fireEvent.compositionEnd(input)
  await user.keyboard('{Enter}')
  expect(screen.getByLabelText('Selected')).toHaveTextContent('sam@example.com')
})
