import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '../field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '../input-group'

it('edits and submits only the input value while preserving native events and selection', async () => {
  const user = userEvent.setup()
  const change = jest.fn()
  const blur = jest.fn()
  const ref = createRef<HTMLInputElement>()

  render(
    <form aria-label="Website">
      <InputGroup>
        <InputGroupInput
          ref={ref}
          name="domain"
          aria-label="Domain"
          defaultValue="acme"
          onChange={change}
          onBlur={blur}
        />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupText>.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </form>,
  )
  const input = screen.getByRole('textbox')

  expect(ref.current).toBe(input)
  await user.click(input)
  ref.current?.setSelectionRange(1, 3)
  await user.keyboard('X')
  expect(input).toHaveValue('aXe')
  expect(ref.current?.selectionStart).toBe(2)
  await user.tab()
  expect(change).toHaveBeenCalledTimes(1)
  expect(blur).toHaveBeenCalledTimes(1)
  expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('domain')).toBe('aXe')
})

it('supports controlled changes and native uncontrolled reset', async () => {
  const user = userEvent.setup()
  const change = jest.fn()
  const { rerender } = render(
    <InputGroup>
      <InputGroupInput aria-label="Domain" value="acme" onChange={change} />
    </InputGroup>,
  )

  rerender(
    <InputGroup>
      <InputGroupInput aria-label="Domain" value="" onChange={change} />
    </InputGroup>,
  )
  expect(screen.getByRole('textbox')).toHaveValue('')
  rerender(
    <form aria-label="Website">
      <InputGroup>
        <InputGroupInput key="uncontrolled" aria-label="Domain" defaultValue="acme" />
      </InputGroup>
    </form>,
  )
  await user.type(screen.getByRole('textbox'), ' edit')
  ;(screen.getByRole('form') as HTMLFormElement).reset()
  expect(screen.getByRole('textbox')).toHaveValue('acme')
})

it.each(['disabled', 'readOnly'] as const)('preserves %s behavior', async (state) => {
  const user = userEvent.setup()

  render(
    <InputGroup>
      <InputGroupInput aria-label="Domain" defaultValue="acme" {...{ [state]: true }} />
    </InputGroup>,
  )
  const input = screen.getByRole('textbox')

  await user.type(input, ' edit')
  expect(input).toHaveValue('acme')
  if (state === 'disabled') expect(input).not.toHaveFocus()
  else expect(input).toHaveFocus()
})

it('respects a disabled fieldset', async () => {
  const user = userEvent.setup()

  render(
    <fieldset disabled>
      <InputGroup>
        <InputGroupInput aria-label="Domain" defaultValue="acme" />
      </InputGroup>
    </fieldset>,
  )
  const input = screen.getByRole('textbox')

  expect(input).toBeDisabled()
  await user.type(input, ' edit')
  expect(input).toHaveValue('acme')
})

it('connects existing Field labels, descriptions and errors to the native control', async () => {
  const user = userEvent.setup()

  render(
    <Field>
      <FieldContent>
        <FieldLabel htmlFor="discount">Discount percentage</FieldLabel>
        <FieldDescription id="discount-help">Between 0 and 100.</FieldDescription>
      </FieldContent>
      <InputGroup>
        <InputGroupInput
          id="discount"
          aria-invalid
          aria-describedby="discount-help discount-error"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>%</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <FieldError id="discount-error">Enter a valid percentage.</FieldError>
    </Field>,
  )
  const input = screen.getByRole('textbox', { name: 'Discount percentage' })

  expect(input).toHaveAccessibleDescription('Between 0 and 100. Enter a valid percentage.')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  await user.click(screen.getByText('Discount percentage'))
  expect(input).toHaveFocus()
  await user.tab()
  expect(input).not.toHaveFocus()
  expect(screen.getByText('%')).not.toHaveFocus()
})

it('passes composition events and native constraints through without transforming text', () => {
  const start = jest.fn()
  const end = jest.fn()

  render(
    <InputGroup>
      <InputGroupInput
        aria-label="Domain"
        required
        maxLength={100}
        onCompositionStart={start}
        onCompositionEnd={end}
      />
    </InputGroup>,
  )
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '文字' } })
  fireEvent.compositionEnd(input, { data: '文字' })
  expect(start).toHaveBeenCalledTimes(1)
  expect(end).toHaveBeenCalledTimes(1)
  expect(input).toHaveValue('文字')
  expect(input).toBeRequired()
  expect(input).toHaveAttribute('maxlength', '100')
})

it.each(['prefix', 'suffix', 'padding'])('focuses the input when clicking %s', async (target) => {
  const user = userEvent.setup()

  render(
    <InputGroup data-testid="group">
      <InputGroupInput aria-label="Domain" defaultValue="acme" />
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupText>.com</InputGroupText>
      </InputGroupAddon>
    </InputGroup>,
  )
  const targets = {
    prefix: screen.getByText('https://'),
    suffix: screen.getByText('.com'),
    padding: screen.getByTestId('group'),
  }

  await user.click(targets[target as keyof typeof targets])
  expect(screen.getByRole('textbox')).toHaveFocus()
  expect(screen.getByRole('textbox')).toHaveValue('acme')
})

it('respects disabled fieldsets, read-only inputs and cancelled consumer handlers on addon clicks', async () => {
  const user = userEvent.setup()
  const example = (disabled: boolean, cancel: boolean) => (
    <fieldset disabled={disabled}>
      <InputGroup onMouseDown={cancel ? (event) => event.preventDefault() : undefined}>
        <InputGroupInput aria-label="Domain" defaultValue="acme" readOnly />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </fieldset>
  )
  const { rerender } = render(example(true, false))

  await user.click(screen.getByText('https://'))
  expect(screen.getByRole('textbox')).not.toHaveFocus()
  rerender(example(false, true))
  await user.click(screen.getByText('https://'))
  expect(screen.getByRole('textbox')).not.toHaveFocus()
  rerender(example(false, false))
  await user.click(screen.getByText('https://'))
  expect(screen.getByRole('textbox')).toHaveFocus()
})
