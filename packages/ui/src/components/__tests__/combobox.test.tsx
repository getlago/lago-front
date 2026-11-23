import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'

import { Combobox, ComboboxProps } from '../combobox'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '../field'
import { TooltipProvider } from '../tooltip'

const options = [
  { value: 'alex', label: 'Alex Morgan', group: 'Owners' },
  { value: 'sam', label: 'Sam Rivera', description: 'Sales', group: 'Owners' },
  { value: 'jamie', label: 'Jamie Chen', disabled: true, group: 'Owners' },
  { value: 'hidden', label: 'Hidden owner', hidden: true },
]
const common = {
  options,
  placeholder: 'Add owners',
  searchLabel: 'Search owners',
  clearSearchLabel: 'Clear search',
  emptyText: 'No owners found',
  loadingText: 'Searching owners',
  'aria-label': 'Owners',
}
const multiple = {
  multiple: true,
  chipsLabel: 'Selected owners',
  removeLabel: (label: string): string => `Remove ${label}`,
} as const

type ExampleProps =
  | Partial<Extract<ComboboxProps, { multiple?: false }>>
  | (Partial<Extract<ComboboxProps, { multiple: true }>> &
      Pick<Extract<ComboboxProps, { multiple: true }>, 'multiple' | 'chipsLabel' | 'removeLabel'>)
const example = (props: ExampleProps = {}): React.ReactElement => (
  <TooltipProvider>
    <Combobox {...common} {...props} />
  </TooltipProvider>
)
const open = async (user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> => {
  await user.click(screen.getByRole('combobox', { name: 'Owners' }))
  const search = await screen.findByRole('combobox', { name: 'Search owners' })

  await waitFor(() => expect(search).toHaveFocus())

  return search
}

it('searches in the popup, selects by keyboard and returns focus', async () => {
  const user = userEvent.setup()
  const change = jest.fn()

  render(example({ onValueChange: change }))
  const search = await open(user)

  await user.type(search, 'Sam')
  expect(screen.getAllByRole('option')).toHaveLength(1)
  await user.keyboard('{ArrowDown}{Enter}')
  expect(change).toHaveBeenLastCalledWith('sam')
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Owners' })).toHaveFocus())
  expect(screen.getByRole('combobox', { name: 'Owners' })).toHaveTextContent('Sam Rivera')
})

it.each(['inside', 'above'] as const)(
  'keeps %s chips and popup search independent',
  async (placement) => {
    const user = userEvent.setup()

    render(example({ ...multiple, placement, defaultValue: ['alex'] }))
    const search = await open(user)

    await user.type(search, 'Sam')
    await user.click(screen.getByRole('option', { name: 'Sam Rivera' }))
    expect(search).toHaveValue('Sam')
    expect(screen.getByRole('button', { name: 'Remove Alex Morgan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Sam Rivera' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(search).toHaveValue('')
    expect(search).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Remove Sam Rivera' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    const trigger = screen.getByRole('combobox', { name: 'Owners' })

    await waitFor(() => expect(trigger).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Remove Alex Morgan' }))
    expect(screen.queryByRole('button', { name: 'Remove Alex Morgan' })).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Remove Sam Rivera' })).toHaveFocus()
  },
)

it('removes chips with the keyboard without opening or submitting', async () => {
  const user = userEvent.setup()
  const submit = jest.fn((event) => event.preventDefault())

  render(<form onSubmit={submit}>{example({ ...multiple, defaultValue: ['alex'] })}</form>)
  act(() => screen.getByRole('button', { name: 'Remove Alex Morgan' }).focus())
  await user.keyboard('{Enter}')
  expect(screen.queryByRole('button', { name: 'Remove Alex Morgan' })).not.toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Owners' })).toHaveFocus()
  expect(screen.getByRole('combobox', { name: 'Owners' })).toHaveAttribute('aria-expanded', 'false')
  expect(submit).not.toHaveBeenCalled()
})

it('retains selected labels when remote results omit them', async () => {
  const user = userEvent.setup()
  const change = jest.fn()
  const selectedOptions = [options[0]]
  const { rerender } = render(
    example({ value: 'alex', onValueChange: change, selectedOptions, filter: 'server' }),
  )

  await open(user)
  rerender(
    example({
      value: 'alex',
      onValueChange: change,
      selectedOptions,
      filter: 'server',
      options: [options[1]],
    }),
  )
  expect(screen.getByRole('combobox', { name: 'Owners' })).toHaveTextContent('Alex Morgan')
  expect(change).not.toHaveBeenCalled()
  expect(screen.getAllByRole('option')).toHaveLength(1)
})

it('does not offer hidden or select disabled choices', async () => {
  const user = userEvent.setup()
  const change = jest.fn()

  render(example({ onValueChange: change }))
  await open(user)
  expect(screen.queryByRole('option', { name: 'Hidden owner' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('option', { name: 'Jamie Chen' }))
  expect(change).not.toHaveBeenCalled()
})

it('has an optional creation action independent of results', async () => {
  const user = userEvent.setup()
  const create = jest.fn()
  const change = jest.fn()

  render(
    example({ onValueChange: change, createAction: { label: 'Create owner', onClick: create } }),
  )
  await open(user)
  expect(screen.getAllByRole('option')).toHaveLength(3)
  await user.click(screen.getByRole('button', { name: 'Create owner' }))
  expect(create).toHaveBeenCalledTimes(1)
  expect(change).not.toHaveBeenCalled()
})

it('announces loading and errors without presenting stale results as empty', async () => {
  const user = userEvent.setup()
  const { rerender } = render(example({ loading: true }))

  await open(user)
  expect(screen.getByRole('dialog', { name: 'Search owners' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Searching owners')
  expect(screen.getByRole('listbox')).not.toContainElement(screen.getByRole('status'))
  expect(screen.queryByRole('option')).not.toBeInTheDocument()
  expect(screen.queryByText('No owners found')).not.toBeInTheDocument()
  rerender(example({ errorText: 'Search failed' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Search failed')
  expect(screen.getByRole('listbox')).not.toContainElement(screen.getByRole('alert'))
  rerender(example({ options: [] }))
  expect(screen.getByRole('status')).toHaveTextContent('No owners found')
  expect(screen.getByRole('listbox')).not.toContainElement(screen.getByRole('status'))
})

it('disables the control and hides removal', async () => {
  const user = userEvent.setup()

  render(example({ ...multiple, disabled: true, defaultValue: ['alex'] }))
  expect(screen.queryByRole('button', { name: 'Remove Alex Morgan' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('combobox', { name: 'Owners' }))
  expect(screen.queryByRole('combobox', { name: 'Search owners' })).not.toBeInTheDocument()
})

it('renders read-only multiple values as badges without a trigger', () => {
  render(example({ ...multiple, readOnly: true, defaultValue: ['alex'] }))
  expect(screen.getByRole('group', { name: 'Owners' })).toHaveTextContent('Alex Morgan')
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('associates Field labels, descriptions and errors with the trigger', async () => {
  const user = userEvent.setup()

  render(
    <TooltipProvider>
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="owners">Quote owners</FieldLabel>
          <FieldDescription id="help">Assign teammates.</FieldDescription>
        </FieldContent>
        <Combobox
          {...common}
          aria-label={undefined}
          id="owners"
          aria-describedby="help error"
          aria-invalid
        />
        <FieldError id="error">Choose an owner.</FieldError>
      </Field>
    </TooltipProvider>,
  )
  const trigger = screen.getByRole('combobox', { name: 'Quote owners' })

  expect(trigger).toHaveAccessibleDescription('Assign teammates. Choose an owner.')
  expect(trigger).toHaveAttribute('aria-invalid', 'true')
  await user.click(screen.getByText('Quote owners'))
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Search owners' })).toHaveFocus())
})

it('submits IDs and resets uncontrolled values natively', async () => {
  const user = userEvent.setup()

  render(
    <form aria-label="Quote">
      {example({ ...multiple, defaultValue: ['alex'], name: 'owners' })}
    </form>,
  )
  const form = screen.getByRole('form') as HTMLFormElement

  expect(new FormData(form).getAll('owners')).toEqual(['alex'])
  await open(user)
  await user.click(screen.getByRole('option', { name: 'Sam Rivera' }))
  expect(new FormData(form).getAll('owners')).toEqual(['alex', 'sam'])
  await act(async () => form.reset())
  expect(new FormData(form).getAll('owners')).toEqual(['alex'])
})

it('does not intercept native search caret placement or commit unmatched text', async () => {
  const user = userEvent.setup()
  const change = jest.fn()

  render(example({ onValueChange: change }))
  const search = (await open(user)) as HTMLInputElement

  await user.type(search, 'unknown')
  await user.pointer({ target: search, offset: 2, keys: '[MouseLeft]' })
  expect(search.selectionStart).toBe(2)
  await user.keyboard('{Enter}')
  expect(change).not.toHaveBeenCalled()
  fireEvent.compositionStart(search)
  fireEvent.compositionEnd(search, { data: '文字' })
  expect(change).not.toHaveBeenCalled()
})

it('keeps a controlled selection on native reset and omits disabled values from submission', async () => {
  const change = jest.fn()
  const { rerender } = render(
    <form aria-label="Quote">
      {example({ value: 'sam', name: 'owner', onValueChange: change })}
    </form>,
  )
  const form = screen.getByRole('form') as HTMLFormElement

  await act(async () => form.reset())
  expect(new FormData(form).get('owner')).toBe('sam')
  expect(change).not.toHaveBeenCalled()
  rerender(
    <form aria-label="Quote">{example({ value: 'sam', name: 'owner', disabled: true })}</form>,
  )
  expect(new FormData(form).has('owner')).toBe(false)
})

it('blocks opening and chip removal inside a disabled fieldset', async () => {
  const user = userEvent.setup()
  const change = jest.fn()

  render(
    <fieldset disabled>
      {example({ ...multiple, defaultValue: ['alex'], onValueChange: change })}
    </fieldset>,
  )
  await user.click(screen.getByRole('combobox', { name: 'Owners' }))
  await user.click(screen.getByRole('button', { name: 'Remove Alex Morgan' }))
  expect(screen.queryByRole('combobox', { name: 'Search owners' })).not.toBeInTheDocument()
  expect(change).not.toHaveBeenCalled()
})

it('keeps read-only single selection visible without opening search', async () => {
  const user = userEvent.setup()

  render(example({ value: 'alex', readOnly: true }))
  await user.click(screen.getByRole('combobox', { name: 'Owners' }))
  expect(screen.getByRole('combobox', { name: 'Owners' })).toHaveTextContent('Alex Morgan')
  expect(screen.queryByRole('combobox', { name: 'Search owners' })).not.toBeInTheDocument()
})
