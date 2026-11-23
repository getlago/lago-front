import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '../field'
import { Textarea } from '../textarea'

it('preserves multiline editing and native form values without submitting on Enter', async () => {
  const user = userEvent.setup()
  const submit = jest.fn((event) => event.preventDefault())
  const change = jest.fn()
  const blur = jest.fn()

  render(
    <form aria-label="Details" onSubmit={submit}>
      <Textarea aria-label="Notes" name="notes" onChange={change} onBlur={blur} />
    </form>,
  )
  const textarea = screen.getByRole('textbox', { name: 'Notes' })

  await user.type(textarea, 'First line{Enter}Second line')
  await user.tab()
  expect(textarea).toHaveValue('First line\nSecond line')
  expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('notes')).toBe(
    'First line\nSecond line',
  )
  expect(change).toHaveBeenCalled()
  expect(blur).toHaveBeenCalledTimes(1)
  expect(submit).not.toHaveBeenCalled()
})

it('forwards the native ref and reflects controlled updates and clearing', () => {
  const ref = createRef<HTMLTextAreaElement>()
  const onChange = jest.fn()
  const { rerender } = render(
    <Textarea ref={ref} aria-label="Notes" value="First" onChange={onChange} />,
  )

  expect(ref.current).toBe(screen.getByRole('textbox'))
  expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  rerender(<Textarea ref={ref} aria-label="Notes" value={'First\nSecond'} onChange={onChange} />)
  expect(ref.current).toHaveValue('First\nSecond')
  rerender(<Textarea ref={ref} aria-label="Notes" value="" onChange={onChange} />)
  expect(ref.current).toHaveValue('')
})

it('supports native reset for an uncontrolled value', async () => {
  const user = userEvent.setup()

  render(
    <form aria-label="Details">
      <Textarea aria-label="Notes" defaultValue="Initial" />
    </form>,
  )
  const textarea = screen.getByRole('textbox')

  await user.type(textarea, ' edit')
  const form = screen.getByRole('form') as HTMLFormElement

  form.reset()
  expect(textarea).toHaveValue('Initial')
})

it('keeps description and error accessible through the existing Field primitives', () => {
  render(
    <Field>
      <FieldContent>
        <FieldLabel htmlFor="notes">Notes</FieldLabel>
        <FieldDescription id="notes-help">Shown on invoices.</FieldDescription>
      </FieldContent>
      <Textarea id="notes" aria-invalid aria-describedby="notes-help notes-error" />
      <FieldError id="notes-error">Enter more detail.</FieldError>
    </Field>,
  )
  const textarea = screen.getByRole('textbox', { name: 'Notes' })

  expect(textarea).toHaveAccessibleDescription('Shown on invoices. Enter more detail.')
  expect(textarea).toHaveAttribute('aria-invalid', 'true')
})

it.each(['disabled', 'readOnly'] as const)('prevents editing when %s', async (state) => {
  const user = userEvent.setup()

  render(<Textarea aria-label="Notes" defaultValue="Original" {...{ [state]: true }} />)
  const textarea = screen.getByRole('textbox')

  await user.type(textarea, 'change')
  expect(textarea).toHaveValue('Original')
  if (state === 'readOnly') expect(textarea).toHaveFocus()
  else expect(textarea).not.toHaveFocus()
})

it('passes through composition events and native constraints', () => {
  const compositionStart = jest.fn()
  const compositionEnd = jest.fn()

  render(
    <Textarea
      aria-label="Notes"
      required
      maxLength={120}
      rows={5}
      onCompositionStart={compositionStart}
      onCompositionEnd={compositionEnd}
    />,
  )
  const textarea = screen.getByRole('textbox')

  fireEvent.compositionStart(textarea)
  fireEvent.compositionEnd(textarea, { data: '文字' })
  expect(compositionStart).toHaveBeenCalledTimes(1)
  expect(compositionEnd).toHaveBeenCalledTimes(1)
  expect(textarea).toBeRequired()
  expect(textarea).toHaveAttribute('maxlength', '120')
  expect(textarea).toHaveAttribute('rows', '5')
})
