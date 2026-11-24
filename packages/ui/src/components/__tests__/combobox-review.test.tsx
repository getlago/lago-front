import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'

import {
  Combobox,
  ComboboxAction,
  ComboboxContent,
  ComboboxFreeText,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxStatus,
} from '../combobox'

beforeEach(() => {
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(240)
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40)
  Element.prototype.scrollIntoView = jest.fn()
})
afterEach(() => jest.restoreAllMocks())

it.each([false, true])(
  'keeps repeated group labels distinct after filtering (virtualized=%s)',
  async (virtualized) => {
    const user = userEvent.setup()
    const error = jest.spyOn(console, 'error')
    const items = ['A-one', 'B-two', 'A-three']

    render(
      <Combobox items={items} virtualized={virtualized} defaultOpen>
        <ComboboxInput aria-label="Grouped" />
        <ComboboxContent>
          <ComboboxList getItemKey={(item: string) => item} groupBy={(item) => item[0]}>
            {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    )
    expect(await screen.findAllByRole('group', { name: 'A' })).toHaveLength(2)
    await user.type(screen.getByRole('combobox'), 'three')
    expect(await screen.findByRole('option', { name: 'A-three' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'A-one' })).not.toBeInTheDocument()
    expect(error.mock.calls.flat().join(' ')).not.toMatch(/same key/)
  },
)

it('creates ID-bearing values only on accepted commits and leaves errors to the caller', async () => {
  const user = userEvent.setup()
  let nextId = 0
  const create = jest.fn((label: string) => ({ id: String(nextId++), label }))
  const detailsSeen: string[] = []

  function Example(): React.ReactElement {
    const [values, setValues] = React.useState<Array<{ id: string; label: string }>>([])
    const [error, setError] = React.useState<string | null>(null)

    return (
      <ComboboxFreeText
        value={values}
        onValueChange={setValues}
        createItem={create}
        getItemKey={(item) => item.id}
        addLabel={(query) => `Add ${query}`}
        validate={(query, selected) =>
          selected.some((item) => item.label === query) ? 'Duplicate' : null
        }
        onValidationChange={setError}
        onInputValueChange={(_query, details) => detailsSeen.push(details.reason)}
      >
        <ComboboxInput
          aria-label="Tags"
          aria-invalid={!!error}
          aria-describedby={error ? 'error' : undefined}
        />
        {error && <p id="error">{error}</p>}
        <button onClick={() => setError(null)}>Reset error</button>
      </ComboboxFreeText>
    )
  }
  render(<Example />)
  const input = screen.getByRole('combobox')

  await user.type(input, 'hello')
  expect(create).not.toHaveBeenCalled()
  await user.keyboard('{Enter}')
  expect(create).toHaveBeenCalledTimes(1)
  expect(detailsSeen).toContain('input-clear')
  await user.type(input, 'hello{Enter}')
  expect(create).toHaveBeenCalledTimes(1)
  expect(input).toHaveAttribute('aria-invalid', 'true')
  await user.click(screen.getByRole('button', { name: 'Reset error' }))
  expect(input).toHaveAttribute('aria-invalid', 'false')
})

it('honors input-change cancellation before changing its uncontrolled query', async () => {
  const user = userEvent.setup()

  render(
    <ComboboxFreeText
      value={[]}
      onValueChange={jest.fn()}
      createItem={(text) => text}
      getItemKey={(text) => text}
      addLabel={(text) => text}
      onInputValueChange={(_query, details) => details.cancel()}
    >
      <ComboboxInput aria-label="Tags" />
    </ComboboxFreeText>,
  )
  await user.type(screen.getByRole('combobox'), 'x')
  expect(screen.getByRole('combobox')).toHaveValue('')
})

it('forwards refs on status, separator and action parts', () => {
  const status = React.createRef<HTMLDivElement>()
  const separator = React.createRef<HTMLDivElement>()
  const action = React.createRef<HTMLButtonElement>()

  render(
    <Combobox>
      <ComboboxStatus ref={status}>Loading</ComboboxStatus>
      <ComboboxSeparator ref={separator} />
      <ComboboxAction ref={action}>Create</ComboboxAction>
    </Combobox>,
  )
  expect(status.current).toBe(screen.getByRole('status'))
  expect(separator.current).toHaveAttribute('data-slot', 'combobox-separator')
  expect(action.current).toBe(screen.getByRole('button', { name: 'Create' }))
})
