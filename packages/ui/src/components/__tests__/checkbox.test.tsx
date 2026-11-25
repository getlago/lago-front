import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { Checkbox } from '../checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../field'

it('toggles once through a sibling label and Space, retaining description and error IDs', async () => {
  const user = userEvent.setup()
  const change = jest.fn()

  render(
    <Field orientation="horizontal">
      <Checkbox id="email" onCheckedChange={change} aria-invalid aria-describedby="help error" />
      <FieldContent>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <FieldDescription id="help">Send invoices.</FieldDescription>
      </FieldContent>
      <FieldError id="error">Choose an option.</FieldError>
    </Field>,
  )
  const checkbox = screen.getByRole('checkbox', { name: 'Email' })

  expect(checkbox).toHaveAccessibleDescription('Send invoices. Choose an option.')
  await user.click(screen.getByText('Email'))
  expect(checkbox).toBeChecked()
  expect(checkbox).toHaveFocus()
  expect(change).toHaveBeenCalledTimes(1)
  await user.keyboard(' ')
  expect(checkbox).not.toBeChecked()
  expect(change).toHaveBeenCalledTimes(2)
})

it('reports mixed activation without mutating a controlled value, then reflects new props', async () => {
  const user = userEvent.setup()
  const change = jest.fn()
  const { rerender } = render(
    <Checkbox aria-label="Select all" checked={false} indeterminate onCheckedChange={change} />,
  )
  const checkbox = screen.getByRole('checkbox')

  expect(checkbox).toBePartiallyChecked()
  await user.click(checkbox)
  expect(change).toHaveBeenCalledWith(true, expect.anything())
  rerender(
    <Checkbox aria-label="Select all" checked indeterminate={false} onCheckedChange={change} />,
  )
  expect(checkbox).toBeChecked()
  await user.click(checkbox)
  expect(change).toHaveBeenLastCalledWith(false, expect.anything())
  expect(checkbox).toBeChecked()
})

it.each([{ readOnly: true }, { disabled: true }])(
  'does not change an immutable checkbox: %j',
  async (props) => {
    const user = userEvent.setup()
    const change = jest.fn()

    render(
      <>
        <Checkbox id="locked" defaultChecked {...props} onCheckedChange={change} />
        <FieldLabel htmlFor="locked">Locked</FieldLabel>
      </>,
    )
    await user.click(screen.getByText('Locked'))
    await user.keyboard(' ')
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(change).not.toHaveBeenCalled()
  },
)

it('preserves caller accessible names and forwards the ref to the visible control', () => {
  const ref = createRef<HTMLElement>()
  const { rerender } = render(<Checkbox ref={ref} aria-label="First name" />)

  expect(ref.current).toBe(screen.getByRole('checkbox', { name: 'First name' }))
  rerender(<Checkbox ref={ref} aria-label="Updated name" />)
  expect(ref.current).toBe(screen.getByRole('checkbox', { name: 'Updated name' }))
})

it('submits checked values, omits disabled fields, resets and never submits on toggle', async () => {
  const user = userEvent.setup()
  const submit = jest.fn((event) => event.preventDefault())

  render(
    <form aria-label="Preferences" onSubmit={submit}>
      <Checkbox name="notifications" value="email" aria-label="Email" defaultChecked />
      <Checkbox name="notifications" value="receipts" aria-label="Receipts" />
      <Checkbox name="locked" value="yes" aria-label="Locked" defaultChecked disabled />
      <button type="reset">Reset</button>
    </form>,
  )
  const form = screen.getByRole('form')

  if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')
  await user.click(screen.getByRole('checkbox', { name: 'Receipts' }))
  expect(new FormData(form).getAll('notifications')).toEqual(['email', 'receipts'])
  expect(new FormData(form).has('locked')).toBe(false)
  expect(submit).not.toHaveBeenCalled()
  await user.click(screen.getByText('Reset'))
  expect(new FormData(form).getAll('notifications')).toEqual(['email'])
})

it('supports a disabled native fieldset without making its labels interactive', async () => {
  const user = userEvent.setup()
  const change = jest.fn()

  render(
    <FieldSet disabled>
      <FieldLegend>Notifications</FieldLegend>
      <Field orientation="horizontal">
        <Checkbox id="receipt" onCheckedChange={change} />
        <FieldLabel htmlFor="receipt">Receipt</FieldLabel>
      </Field>
    </FieldSet>,
  )
  await user.click(screen.getByText('Receipt'))
  expect(screen.getByRole('checkbox')).toBeDisabled()
  expect(change).not.toHaveBeenCalled()
})

it('honors cancellation without duplicating state', async () => {
  const user = userEvent.setup()

  render(<Checkbox aria-label="Approval" onCheckedChange={(_, details) => details.cancel()} />)
  await user.click(screen.getByRole('checkbox'))
  expect(screen.getByRole('checkbox')).not.toBeChecked()
})
