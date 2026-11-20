import { createFormHook, revalidateLogic } from '@tanstack/react-form'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from 'lago-ui/tooltip'
import { createRef, Ref } from 'react'
import { z } from 'zod'

import { fieldContext, formContext } from '~/hooks/forms/formContext'

import InputField, { InputFieldProps } from '../InputFieldForTanstack'

const mockTranslate = jest.fn((key: string) => `translated_${key}`)

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: mockTranslate }),
}))

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField },
  formComponents: {},
})
const submitted = jest.fn()

const Example = ({
  inputProps = {},
  inputRef,
  initialValue = '',
}: {
  inputProps?: InputFieldProps
  inputRef?: Ref<HTMLInputElement>
  initialValue?: string
}) => {
  const form = useAppForm({
    defaultValues: { value: initialValue },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: z.object({ value: z.string().min(1, 'required') }) },
    onSubmit: ({ value }) => submitted(value),
  })

  return (
    <TooltipProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.AppField name="value">
          {(field) => <field.InputField ref={inputRef} label="Value" {...inputProps} />}
        </form.AppField>
        <button type="submit">Submit</button>
        <button type="button" onClick={() => form.reset()}>
          Reset
        </button>
        <button type="button" onClick={() => form.setFieldValue('value', 'loaded')}>
          Load
        </button>
        <button
          type="button"
          onClick={() =>
            form.setErrorMap({
              onDynamic: { fields: { value: { message: 'server', path: ['value'] } } },
            })
          }
        >
          Server error
        </button>
        <form.Subscribe
          selector={(state) => ({
            value: state.values.value,
            touched: state.fieldMeta.value?.isTouched,
          })}
        >
          {(state) => <output data-testid="state">{JSON.stringify(state)}</output>}
        </form.Subscribe>
      </form>
    </TooltipProvider>
  )
}

const state = (): { value: string; touched: boolean } =>
  JSON.parse(screen.getByTestId('state').textContent || '{}')

beforeEach(() => jest.clearAllMocks())

it('validates on submit, revalidates on change, and preserves server error clearing and reset', async () => {
  const user = userEvent.setup()

  render(<Example />)
  const input = screen.getByLabelText('Value')

  expect(input).toHaveAttribute('aria-invalid', 'false')
  await user.click(screen.getByText('Submit'))
  expect(await screen.findByText('translated_required')).toBeInTheDocument()
  expect(input).toHaveAccessibleDescription('translated_required')
  expect(submitted).not.toHaveBeenCalled()
  await user.type(input, 'valid')
  await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'false'))
  await user.click(screen.getByText('Submit'))
  expect(submitted).toHaveBeenCalledWith({ value: 'valid' })
  await user.click(screen.getByText('Server error'))
  expect(await screen.findByText('translated_server')).toBeInTheDocument()
  await user.type(input, '!')
  await waitFor(() => expect(screen.queryByText('translated_server')).not.toBeInTheDocument())
  await user.click(screen.getByText('Reset'))
  expect(input).toHaveValue('')
  expect(input).toHaveAttribute('aria-invalid', 'false')
})

it('keeps formatted integer edits as strings, rejects invalid edits and accepts clearing', async () => {
  const user = userEvent.setup()

  render(<Example inputProps={{ beforeChangeFormatter: 'int', inputMode: 'numeric' }} />)
  const input = screen.getByLabelText('Value')

  await user.type(input, '-')
  expect(state().value).toBe('-')
  await user.type(input, '12')
  expect(state().value).toBe('-12')
  await user.type(input, 'x')
  expect(input).toHaveValue('-12')
  expect(state().value).toBe('-12')
  await user.clear(input)
  expect(state().value).toBe('')
  await user.type(input, '0')
  expect(state().value).toBe('0')
  await user.tab()
  expect(state().touched).toBe(true)
})

it('formats pasted decimals without rounding and preserves partial decimals', async () => {
  const user = userEvent.setup()

  render(<Example inputProps={{ beforeChangeFormatter: 'decimal' }} />)
  const input = screen.getByLabelText('Value')

  await user.click(input)
  await user.paste('-12.34567')
  expect(input).toHaveValue('-12.34')
  expect(state().value).toBe('-12.34')
  await user.clear(input)
  await user.type(input, '12.')
  expect(state().value).toBe('12.')
})

it('keeps the caret at a transformed edit in the middle and preserves formatter order', () => {
  render(
    <Example initialValue="abcd" inputProps={{ beforeChangeFormatter: ['lowercase', 'code'] }} />,
  )
  const input = screen.getByLabelText<HTMLInputElement>('Value')

  fireEvent.change(input, { target: { value: 'ab Xcd', selectionStart: 4, selectionEnd: 4 } })
  expect(input).toHaveValue('ab_xcd')
  expect(input.selectionStart).toBe(4)
  expect(state().value).toBe('ab_xcd')
})

it('waits until composition ends before formatting and publishing the value', () => {
  render(<Example inputProps={{ beforeChangeFormatter: 'lowercase' }} />)
  const input = screen.getByLabelText('Value')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: 'ÉT' } })
  expect(input).toHaveValue('ÉT')
  expect(state().value).toBe('')
  fireEvent.compositionEnd(input)
  expect(input).toHaveValue('ét')
  expect(state().value).toBe('ét')
})

it('exposes a native ref and updates after programmatic values and reset', async () => {
  const user = userEvent.setup()
  const ref = createRef<HTMLInputElement>()

  render(
    <Example
      inputRef={ref}
      inputProps={{
        description: 'Description',
        helperText: 'Help',
        'aria-describedby': 'external',
      }}
    />,
  )
  const input = screen.getByLabelText('Value')

  expect(ref.current).toBe(input)
  expect(input).toHaveAccessibleDescription('Description Help')
  expect(input.getAttribute('aria-describedby')).toContain('external')
  act(() => ref.current?.focus())
  expect(input).toHaveFocus()
  await user.click(screen.getByText('Load'))
  expect(input).toHaveValue('loaded')
  await user.click(screen.getByText('Reset'))
  expect(input).toHaveValue('')
})

it.each([
  [{ silentError: true }, false, false],
  [{ displayErrorText: false }, true, false],
  [{ showOnlyErrors: ['other'] }, false, false],
  [{ errorOverride: false }, false, false],
  [{ errorOverride: true }, true, false],
  [{ errorOverride: 'Override', silentError: true }, true, true],
] as Array<[InputFieldProps, boolean, boolean]>)(
  'preserves error display options %j',
  async (inputProps, invalid, textVisible) => {
    const user = userEvent.setup()

    render(
      <Example
        inputProps={{
          ...inputProps,
          showOnlyErrors: inputProps.showOnlyErrors ? [...inputProps.showOnlyErrors] : undefined,
        }}
      />,
    )
    await user.click(screen.getByText('Submit'))
    await waitFor(() =>
      expect(screen.getByLabelText('Value')).toHaveAttribute('aria-invalid', String(invalid)),
    )
    expect(screen.queryByText('translated_required')).not.toBeInTheDocument()
    expect(!!screen.queryByText('Override')).toBe(textVisible)
  },
)

it('uses contextual translation exactly once and retains error-helper precedence', async () => {
  const user = userEvent.setup()
  const translateError = jest.fn(() => 'Localized error')

  render(<Example inputProps={{ translateError, helperText: 'Helpful text' }} />)
  await user.click(screen.getByText('Submit'))
  expect(await screen.findByText('Localized error')).toBeInTheDocument()
  expect(screen.queryByText('Helpful text')).not.toBeInTheDocument()
  expect(translateError).toHaveBeenCalledWith('required')
  expect(mockTranslate).not.toHaveBeenCalled()
})

it('reveals the password without changing its value or submitting', async () => {
  const user = userEvent.setup()

  render(<Example initialValue="secret" inputProps={{ type: 'password' }} />)
  await user.click(screen.getByRole('button', { name: 'translated_text_620bc4d4269a55014d493f8f' }))
  expect(screen.getByLabelText('Value')).toHaveAttribute('type', 'text')
  expect(state().value).toBe('secret')
  expect(submitted).not.toHaveBeenCalled()
})

it.each([{ disabled: true }, { readOnly: true }])('prevents edits with %j', async (inputProps) => {
  const user = userEvent.setup()

  render(<Example initialValue="retained" inputProps={inputProps} />)
  await user.type(screen.getByLabelText('Value'), 'changed')
  expect(state().value).toBe('retained')
})

it('renders search and borderless variants with stable label associations', () => {
  const { rerender } = render(<Example inputProps={{ type: 'search', id: 'search-value' }} />)

  expect(screen.getByRole('searchbox', { name: 'Value' })).toHaveAttribute('id', 'search-value')
  rerender(<Example inputProps={{ variant: 'borderless', id: 'borderless-value' }} />)
  expect(screen.getByLabelText('Value')).toHaveAttribute('data-variant', 'borderless')
})
