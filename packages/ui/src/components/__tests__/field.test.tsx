import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AddableExample } from '../../stories/addable-field-example'
import { Field, FieldContent, FieldDescription, FieldError, FieldHelp, FieldLabel } from '../field'
import { Input } from '../input'
import { TooltipProvider } from '../tooltip'

afterEach(cleanup)

it('associates labels, descriptions and errors with the input', async () => {
  const user = userEvent.setup()

  render(
    <Field>
      <FieldContent>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <FieldDescription id="description">Shown on invoices.</FieldDescription>
      </FieldContent>
      <div>
        <Input id="name" aria-invalid aria-describedby="description error" />
        <FieldError id="error">Enter a name.</FieldError>
      </div>
    </Field>,
  )
  const input = screen.getByRole('textbox', { name: 'Name' })

  expect(input).toHaveAccessibleDescription('Shown on invoices. Enter a name.')
  await user.click(screen.getByText('Name'))
  expect(input).toHaveFocus()
})

it('opens help with keyboard focus and dismisses with Escape', async () => {
  const user = userEvent.setup()

  render(
    <TooltipProvider>
      <FieldHelp label="About name">Shown on invoices.</FieldHelp>
    </TooltipProvider>,
  )
  await user.tab()
  expect(screen.getByRole('button', { name: 'About name' })).toHaveFocus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Shown on invoices.')
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  expect(screen.getByRole('button')).toHaveFocus()
})

it('clears an Addable value on remove and re-add, restoring focus', async () => {
  const user = userEvent.setup()

  render(
    <TooltipProvider>
      <AddableExample />
    </TooltipProvider>,
  )
  await user.click(screen.getByRole('button', { name: 'Add value' }))
  const input = screen.getByRole('textbox', { name: 'Customer reference' })

  expect(input).toHaveFocus()
  await user.type(input, 'old reference')
  await user.click(screen.getByRole('button', { name: 'Delete' }))
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Add value' })).toHaveFocus()
  await user.click(screen.getByRole('button', { name: 'Add value' }))
  expect(screen.getByRole('textbox')).toHaveValue('')
  expect(screen.getByRole('textbox')).toHaveFocus()
})

it('prevents Addable edits when disabled or read-only', () => {
  const { rerender } = render(<AddableExample disabled />)

  expect(screen.getByRole('button')).toBeDisabled()
  rerender(<AddableExample readOnly />)
  expect(screen.getByRole('button')).toBeDisabled()
})
