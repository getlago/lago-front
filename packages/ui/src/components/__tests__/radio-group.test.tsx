import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { Field, FieldContent, FieldDescription, FieldLabel } from '../field'
import { RadioGroup, RadioGroupItem } from '../radio-group'

it('selects by label and arrows, skips disabled items, and has one tab stop', async () => {
  const user = userEvent.setup()
  const change = jest.fn()

  render(
    <>
      <RadioGroup defaultValue="auto" onValueChange={change} aria-label="Collection">
        <Field orientation="horizontal">
          <RadioGroupItem id="auto" value="auto" />
          <FieldLabel htmlFor="auto">Automatic</FieldLabel>
        </Field>
        <RadioGroupItem value="locked" disabled aria-label="Locked" />
        <Field orientation="horizontal">
          <RadioGroupItem id="manual" value="manual" aria-describedby="help" />
          <FieldContent>
            <FieldLabel htmlFor="manual">Manual</FieldLabel>
            <FieldDescription id="help">Collect outside Lago.</FieldDescription>
          </FieldContent>
        </Field>
      </RadioGroup>
      <button>Next</button>
    </>,
  )
  await user.tab()
  expect(screen.getByRole('radio', { name: 'Automatic' })).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  const manual = screen.getByRole('radio', { name: 'Manual' })

  expect(manual).toBeChecked()
  expect(manual).toHaveFocus()
  expect(manual).toHaveAccessibleDescription('Collect outside Lago.')
  expect(screen.getByRole('radio', { name: 'Automatic' })).not.toBeChecked()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
  await user.click(screen.getByText('Automatic'))
  expect(change).toHaveBeenLastCalledWith('auto', expect.anything())
  change.mockClear()
  await user.click(screen.getByText('Automatic'))
  expect(change).not.toHaveBeenCalled()
})

it.each([true, 42])('preserves typed values in a controlled group: %j', async (value) => {
  const user = userEvent.setup()
  const change = jest.fn()
  const { rerender } = render(
    <RadioGroup value={null} onValueChange={change}>
      <RadioGroupItem value={value} aria-label="Choice" />
    </RadioGroup>,
  )

  await user.click(screen.getByRole('radio'))
  expect(change).toHaveBeenCalledWith(value, expect.anything())
  expect(screen.getByRole('radio')).not.toBeChecked()
  rerender(
    <RadioGroup value={value} onValueChange={change}>
      <RadioGroupItem value={value} aria-label="Choice" />
    </RadioGroup>,
  )
  expect(screen.getByRole('radio')).toBeChecked()
})

it.each([{ readOnly: true }, { disabled: true }])(
  'prevents group changes when immutable: %j',
  async (props) => {
    const user = userEvent.setup()
    const change = jest.fn()

    render(
      <RadioGroup defaultValue="first" onValueChange={change} {...props}>
        <RadioGroupItem value="first" aria-label="First" />
        <RadioGroupItem value="second" aria-label="Second" />
      </RadioGroup>,
    )
    await user.click(screen.getByRole('radio', { name: 'Second' }))
    await user.keyboard('{ArrowDown} ')
    expect(screen.getByRole('radio', { name: 'First' })).toBeChecked()
    expect(change).not.toHaveBeenCalled()
  },
)

it('keeps separate groups independent and preserves visible control refs and ARIA', async () => {
  const user = userEvent.setup()
  const ref = createRef<HTMLElement>()

  render(
    <>
      <RadioGroup aria-label="First group">
        <RadioGroupItem ref={ref} value="same" aria-label="First" aria-invalid />
      </RadioGroup>
      <RadioGroup aria-label="Second group">
        <RadioGroupItem value="same" aria-label="Second" />
      </RadioGroup>
    </>,
  )
  await user.click(screen.getByRole('radio', { name: 'First' }))
  await user.click(screen.getByRole('radio', { name: 'Second' }))
  expect(ref.current).toBe(screen.getByRole('radio', { name: 'First' }))
  expect(ref.current).toHaveAttribute('aria-invalid', 'true')
  for (const group of screen.getAllByRole('radiogroup'))
    expect(within(group).getByRole('radio')).toBeChecked()
})

it('submits the selected value and restores the default on native reset', async () => {
  const user = userEvent.setup()

  render(
    <form aria-label="Invoice">
      <RadioGroup name="collection" defaultValue="automatic">
        <RadioGroupItem value="automatic" aria-label="Automatic" />
        <RadioGroupItem value="manual" aria-label="Manual" />
      </RadioGroup>
      <button type="reset">Reset</button>
    </form>,
  )
  const form = screen.getByRole('form')

  if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')
  await user.click(screen.getByRole('radio', { name: 'Manual' }))
  expect(new FormData(form).get('collection')).toBe('manual')
  await user.click(screen.getByText('Reset'))
  expect(new FormData(form).get('collection')).toBe('automatic')
  expect(screen.getByRole('radio', { name: 'Automatic' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Manual' })).not.toBeChecked()
})

it('returns to no selection on reset and honors cancellation of changes', async () => {
  const user = userEvent.setup()
  const change = jest.fn()
  const inputRef = createRef<HTMLInputElement>()
  const { rerender } = render(
    <form>
      <RadioGroup inputRef={inputRef} onValueChange={change}>
        <RadioGroupItem value="auto" aria-label="Automatic" />
      </RadioGroup>
      <button type="reset">Reset</button>
    </form>,
  )

  await user.click(screen.getByRole('radio'))
  expect(inputRef.current?.checked).toBe(true)
  await user.click(screen.getByText('Reset'))
  expect(screen.getByRole('radio')).not.toBeChecked()
  expect(inputRef.current?.checked).toBe(false)
  expect(change).toHaveBeenCalledTimes(1)
  rerender(
    <form>
      <RadioGroup onValueChange={(_, details) => details.cancel()}>
        <RadioGroupItem value="auto" aria-label="Automatic" />
      </RadioGroup>
      <button type="reset">Reset</button>
    </form>,
  )
  await user.click(screen.getByRole('radio'))
  expect(screen.getByRole('radio')).not.toBeChecked()
})

it('preserves the selected and submitted radio value when reset is canceled', async () => {
  const user = userEvent.setup()

  render(
    <form aria-label="Canceled reset" onReset={(event) => event.preventDefault()}>
      <RadioGroup name="collection" defaultValue="automatic">
        <RadioGroupItem value="automatic" aria-label="Automatic" />
        <RadioGroupItem value="manual" aria-label="Manual" />
      </RadioGroup>
      <button type="reset">Reset</button>
    </form>,
  )
  const form = screen.getByRole('form')

  if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')
  await user.click(screen.getByRole('radio', { name: 'Manual' }))
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  expect(screen.getByRole('radio', { name: 'Manual' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Automatic' })).not.toBeChecked()
  expect(new FormData(form).get('collection')).toBe('manual')
})
