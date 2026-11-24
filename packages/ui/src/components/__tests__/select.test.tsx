import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { ColorTheme } from '../color-theme'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '../field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectProps,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../select'

const periods = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' },
]

function Example(props: SelectProps<string>): JSX.Element {
  return (
    <Select items={periods} {...props}>
      <SelectTrigger aria-label="Billing period">
        <SelectValue placeholder="Choose a period" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Recurring</SelectLabel>
          {periods.map((item) => (
            <SelectItem key={item.value} {...item} description={`Bill ${item.label}`} />
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="custom" label="Custom" disabled />
      </SelectContent>
    </Select>
  )
}

it('selects a label while emitting its value once, then restores focus on Escape', async () => {
  const user = userEvent.setup()
  const changed = jest.fn()

  render(<Example onValueChange={changed} />)
  const trigger = screen.getByRole('combobox', { name: 'Billing period' })

  expect(trigger).toHaveTextContent('Choose a period')
  await user.click(trigger)
  await user.click(await screen.findByRole('option', { name: 'Quarterly' }))
  expect(changed).toHaveBeenCalledTimes(1)
  expect(changed).toHaveBeenCalledWith('quarter', expect.anything())
  expect(trigger).toHaveTextContent('Quarterly')
  expect(trigger).not.toHaveTextContent('Bill Quarterly')
  await user.click(trigger)
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  expect(trigger).toHaveFocus()
  expect(changed).toHaveBeenCalledTimes(1)
})

it('navigates with keyboard typeahead without selecting headers or disabled options', async () => {
  const user = userEvent.setup()
  const changed = jest.fn()

  render(<Example onValueChange={changed} />)
  await user.tab()
  await user.keyboard('{ArrowDown}')
  await screen.findByRole('listbox')
  expect(screen.getAllByRole('option')).toHaveLength(4)
  await user.keyboard('y{Enter}')
  expect(changed).toHaveBeenLastCalledWith('year', expect.anything())
  await user.click(screen.getByRole('combobox'))
  fireEvent.click(await screen.findByRole('option', { name: 'Custom' }))
  expect(changed).toHaveBeenCalledTimes(1)
})

it.each([{ defaultOpen: true }, { open: true }])(
  'prevents readonly opening even with %j',
  async (props) => {
    const user = userEvent.setup()
    const changed = jest.fn()

    render(
      <Example {...props} readOnly defaultValue="month" name="period" onValueChange={changed} />,
    )
    const trigger = screen.getByRole('combobox')

    expect(trigger).toHaveAttribute('aria-readonly', 'true')
    expect(trigger).not.toBeDisabled()
    await user.click(trigger)
    await user.keyboard('{ArrowDown}{Enter}y')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(changed).not.toHaveBeenCalled()
    expect(trigger).toHaveTextContent('Monthly')
    expect(document.querySelector('input[name="period"]')).toHaveValue('month')
  },
)

it('closes on readonly transition and stays closed when editing is restored', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<Example defaultValue="month" />)

  await user.click(screen.getByRole('combobox'))
  await screen.findByRole('listbox')
  rerender(<Example defaultValue="month" readOnly />)
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  rerender(<Example defaultValue="month" />)
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

it('does not open or submit disabled controls', async () => {
  const user = userEvent.setup()
  const { container } = render(
    <form>
      <Example disabled name="period" defaultValue="month" />
    </form>,
  )

  await user.click(screen.getByRole('combobox'))
  expect(screen.getByRole('combobox')).toBeDisabled()
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(new FormData(container.querySelector('form') ?? undefined).has('period')).toBe(false)
})

it('honors cancelled open requests and controlled closing', async () => {
  const user = userEvent.setup()
  const onOpen = jest.fn<
    ReturnType<NonNullable<SelectProps['onOpenChange']>>,
    Parameters<NonNullable<SelectProps['onOpenChange']>>
  >((_open, details) => details.cancel())
  const { rerender } = render(<Example onOpenChange={onOpen} />)

  await user.tab()
  await user.keyboard('{Enter}')
  expect(onOpen).toHaveBeenCalled()
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  rerender(<Example open />)
  await screen.findByRole('listbox')
  rerender(<Example open={false} />)
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
})

it('preserves numeric zero, updates labels while closed, and resets to the placeholder', () => {
  function Numeric({ value, label }: { value: number | null; label: string }): JSX.Element {
    return (
      <Select value={value} items={[{ value: 0, label }]} name="interval">
        <SelectTrigger aria-label="Interval">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={0} label={label} />
        </SelectContent>
      </Select>
    )
  }
  const { rerender } = render(<Numeric value={0} label="Off" />)

  expect(screen.getByRole('combobox')).toHaveTextContent('Off')
  expect(document.querySelector('input[name="interval"]')).toHaveValue('0')
  rerender(<Numeric value={0} label="Disabled refresh" />)
  expect(screen.getByRole('combobox')).toHaveTextContent('Disabled refresh')
  rerender(<Numeric value={null} label="Disabled refresh" />)
  expect(screen.getByRole('combobox')).toHaveTextContent('Choose')
})

it('composes existing Field labels, descriptions, invalid styling and a native button ref', async () => {
  const user = userEvent.setup()
  const ref = createRef<HTMLButtonElement>()

  render(
    <Field>
      <FieldContent>
        <FieldLabel htmlFor="period">Period</FieldLabel>
        <FieldDescription id="period-help">Choose when to bill.</FieldDescription>
      </FieldContent>
      <Select items={periods}>
        <SelectTrigger
          ref={ref}
          id="period"
          aria-invalid
          aria-describedby="period-help period-error"
        >
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month" label="Monthly" />
        </SelectContent>
      </Select>
      <FieldError id="period-error">Required</FieldError>
    </Field>,
  )
  const trigger = screen.getByRole('combobox', { name: 'Period' })

  expect(ref.current).toBe(trigger)
  expect(trigger).toHaveAttribute('aria-invalid', 'true')
  expect(trigger).toHaveAccessibleDescription('Choose when to bill. Required')
  await user.click(screen.getByText('Period'))
  await screen.findByRole('option', { name: 'Monthly' })
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await user.keyboard('{Escape}')
  await waitFor(() => expect(trigger).toHaveFocus())
})

it('inherits the local dark theme in the body portal', async () => {
  const user = userEvent.setup()

  render(
    <ColorTheme mode="dark">
      <Example />
    </ColorTheme>,
  )
  await user.click(screen.getByRole('combobox'))
  const list = await screen.findByRole('listbox')

  expect(list.closest('[data-color-theme]')).toHaveAttribute('data-color-theme', 'dark')
  expect(list.closest('.v2-select-positioner')).toHaveAttribute('data-side', 'bottom')
})

it('keeps a controlled value authoritative and does not choose an option when its label is missing', async () => {
  const user = userEvent.setup()
  const changed = jest.fn()
  const { rerender } = render(<Example value="year" onValueChange={changed} />)

  await user.click(screen.getByRole('combobox'))
  await user.click(await screen.findByRole('option', { name: 'Monthly' }))
  expect(changed).toHaveBeenCalledWith('month', expect.anything())
  expect(screen.getByRole('combobox')).toHaveTextContent('Yearly')
  rerender(<Example value="removed" onValueChange={changed} items={[]} />)
  expect(changed).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('combobox')).not.toHaveTextContent('Monthly')
})
