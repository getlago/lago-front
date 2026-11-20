import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
      <Input id="name" aria-invalid aria-describedby="description error" />
      <FieldError id="error">Enter a name.</FieldError>
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
