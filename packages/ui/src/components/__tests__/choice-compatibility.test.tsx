import { Checkbox } from '@base-ui/react/checkbox'
import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Field, FieldLabel } from '../field'

it('supports sibling labels, mixed activation, form values and reset without Base UI Field', async () => {
  const user = userEvent.setup()
  const change = jest.fn()

  render(
    <form aria-label="Preferences">
      <Field>
        <Checkbox.Root
          id="email"
          name="email"
          value="yes"
          indeterminate
          nativeButton
          render={<button />}
          onCheckedChange={change}
        />
        <FieldLabel htmlFor="email">Email</FieldLabel>
      </Field>
      <button type="reset">Reset</button>
    </form>,
  )
  const checkbox = screen.getByRole('checkbox', { name: 'Email' })

  expect(checkbox).toBePartiallyChecked()
  await user.click(screen.getByText('Email'))
  expect(change).toHaveBeenCalledTimes(1)
  expect(change).toHaveBeenCalledWith(true, expect.anything())
  expect(checkbox).toHaveFocus()
  const form = screen.getByRole('form')

  if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')
  expect(new FormData(form).get('email')).toBe('yes')
  await user.click(screen.getByText('Reset'))
  expect(new FormData(form).has('email')).toBe(false)
})

it('supports radio label activation, arrow navigation and read-only values', async () => {
  const user = userEvent.setup()
  const content = (readOnly: boolean): React.ReactElement => (
    <RadioGroup defaultValue="automatic" readOnly={readOnly} aria-label="Collection">
      <Radio.Root id="automatic" value="automatic" nativeButton render={<button />} />
      <FieldLabel htmlFor="automatic">Automatic</FieldLabel>
      <Radio.Root
        value="unavailable"
        disabled
        nativeButton
        render={<button />}
        aria-label="Unavailable"
      />
      <Radio.Root id="manual" value="manual" nativeButton render={<button />} />
      <FieldLabel htmlFor="manual">Manual</FieldLabel>
    </RadioGroup>
  )
  const { rerender } = render(content(false))

  await user.click(screen.getByText('Automatic'))
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('radio', { name: 'Manual' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Manual' })).toHaveFocus()
  rerender(content(true))
  await user.click(screen.getByText('Automatic'))
  expect(screen.getByRole('radio', { name: 'Manual' })).toBeChecked()
})
