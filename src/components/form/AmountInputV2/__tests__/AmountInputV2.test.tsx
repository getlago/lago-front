import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from 'lago-ui/field'
import { TooltipProvider } from 'lago-ui/tooltip'
import { createRef, useState } from 'react'

import { initializeTranslations } from '~/core/apolloClient/reactiveVars/internationalizationVar'
import { CurrencyEnum } from '~/generated/graphql'

import { AmountInputV2, AmountInputV2Props } from '../AmountInputV2'

beforeAll(async () => {
  await initializeTranslations()
  Element.prototype.scrollIntoView = jest.fn()
})
function Controlled(
  props: Partial<Omit<AmountInputV2Props, 'mode' | 'currencyOptions' | 'onCurrencyChange'>>,
): JSX.Element {
  const [value, setValue] = useState(props.value ?? '')

  return (
    <AmountInputV2
      currency={CurrencyEnum.Usd}
      {...props}
      mode="fixed"
      value={value}
      onChange={(next, event) => {
        setValue(next)
        props.onChange?.(next, event)
      }}
      aria-label="Amount"
    />
  )
}
it.each([
  [CurrencyEnum.Usd, '001.239', '001.23', '0.00'],
  [CurrencyEnum.Jpy, '001.239', '1', '0'],
  [CurrencyEnum.Bhd, '1.2349', '1.234', '0.000'],
  [CurrencyEnum.Clf, '1.23459', '1.2345', '0.0000'],
])('preserves %s precision and placeholder', (currency, candidate, expected, placeholder) => {
  const change = jest.fn()

  render(<Controlled currency={currency} onChange={change} />)
  const input = screen.getByRole('textbox', { name: 'Amount' })

  expect(input).toHaveAttribute('placeholder', placeholder)
  fireEvent.change(input, { target: { value: candidate } })
  expect(input).toHaveValue(expected)
  expect(change).toHaveBeenCalledWith(expected, expect.anything())
})
it('retains charge precision, custom units, negatives, trailing zeros, and explicit placeholders', () => {
  render(
    <Controlled
      currency={CurrencyEnum.Jpy}
      chargePricingUnitShortName="credits"
      beforeChangeFormatter="chargeDecimal"
      prefix=""
      suffix="credits"
      placeholder=""
    />,
  )
  const input = screen.getByRole('textbox')

  expect(input).toHaveAttribute('placeholder', '')
  fireEvent.change(input, { target: { value: '-001.1234567890123456' } })
  expect(input).toHaveValue('-001.123456789012345')
  fireEvent.change(input, { target: { value: '-1.20' } })
  expect(input).toHaveValue('-1.20')
  fireEvent.change(input, { target: { value: '-' } })
  expect(input).toHaveValue('-')
})
it('keeps empty distinct from zero and retains the original event candidate', () => {
  const observed: string[] = []

  render(
    <Controlled
      beforeChangeFormatter="positiveNumber"
      onChange={(_value, event) => observed.push(event.currentTarget.value)}
    />,
  )
  const input = screen.getByRole('textbox')

  fireEvent.change(input, { target: { value: '-12.345' } })
  expect(input).toHaveValue('12.34')
  expect(observed).toEqual(['-12.345'])
  fireEvent.change(input, { target: { value: '0' } })
  expect(input).toHaveValue('0')
  fireEvent.change(input, { target: { value: '' } })
  expect(input).toHaveValue('')
})
it('rejects an invalid middle insertion, restores the caret and accepts the next key', async () => {
  const user = userEvent.setup()
  const change = jest.fn()

  render(<Controlled value="12.30" onChange={change} />)
  const input = screen.getByRole('textbox') as HTMLInputElement

  await user.click(input)
  input.setSelectionRange(1, 1)
  await user.keyboard('x')
  expect(input).toHaveValue('12.30')
  expect(input.selectionStart).toBe(1)
  expect(change).not.toHaveBeenCalled()
  await user.keyboard('4')
  expect(input).toHaveValue('142.30')
})
it('does not move a middle insertion to the end when trailing precision is truncated', async () => {
  const user = userEvent.setup()

  render(<Controlled value="12.34" />)
  const input = screen.getByRole('textbox') as HTMLInputElement

  await user.click(input)
  input.setSelectionRange(4, 4)
  await user.keyboard('9')
  expect(input).toHaveValue('12.39')
  expect(input.selectionStart).toBe(5)
})
it('defers formatting until composition ends without duplicate emission', () => {
  const change = jest.fn()

  render(<Controlled onChange={change} />)
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '1.239' } })
  expect(input).toHaveValue('1.239')
  expect(change).not.toHaveBeenCalled()
  fireEvent.compositionEnd(input)
  expect(input).toHaveValue('1.23')
  fireEvent.change(input, { target: { value: '1.239' } })
  expect(input).toHaveValue('1.23')
  expect(change).toHaveBeenCalledTimes(1)
})
it('external values and currency changes are displayed without reformatting', () => {
  const change = jest.fn()
  const { rerender } = render(
    <AmountInputV2
      currency={CurrencyEnum.Clf}
      value="123.4567"
      onChange={change}
      aria-label="Amount"
    />,
  )

  rerender(
    <AmountInputV2
      currency={CurrencyEnum.Jpy}
      value="123.4567"
      onChange={change}
      aria-label="Amount"
    />,
  )
  expect(screen.getByRole('textbox')).toHaveValue('123.4567')
  expect(change).not.toHaveBeenCalled()
  rerender(
    <AmountInputV2 currency={CurrencyEnum.Jpy} value={0} onChange={change} aria-label="Amount" />,
  )
  expect(screen.getByRole('textbox')).toHaveValue('0')
  rerender(
    <AmountInputV2
      currency={CurrencyEnum.Jpy}
      value={undefined}
      onChange={change}
      aria-label="Amount"
    />,
  )
  expect(screen.getByRole('textbox')).toHaveValue('')
})
it('composes a labelled invalid Field and exposes the native input ref', async () => {
  const ref = createRef<HTMLInputElement>()
  const user = userEvent.setup()

  render(
    <Field>
      <FieldContent>
        <FieldLabel htmlFor="amount">Price</FieldLabel>
        <FieldDescription id="help">In USD</FieldDescription>
      </FieldContent>
      <AmountInputV2
        id="amount"
        ref={ref}
        currency={CurrencyEnum.Usd}
        value="1"
        onChange={jest.fn()}
        aria-invalid
        aria-describedby="help error"
      />
      <FieldError id="error">Too low</FieldError>
    </Field>,
  )
  await user.click(screen.getByText('Price'))
  expect(ref.current).toHaveFocus()
  expect(ref.current).toHaveAccessibleDescription('In USD Too low')
  expect(ref.current).toHaveAttribute('aria-invalid', 'true')
})
const options = [
  { value: CurrencyEnum.Usd, label: 'US Dollar' },
  { value: CurrencyEnum.Jpy, label: 'Japanese Yen' },
]

it('searches names, clears query only, and changes currency without changing amount', async () => {
  const user = userEvent.setup()
  const amountChanged = jest.fn()
  const currencyChanged = jest.fn()

  function Selectable(): JSX.Element {
    const [currency, setCurrency] = useState(CurrencyEnum.Usd)

    return (
      <AmountInputV2
        mode="selectable"
        currencyOptions={options}
        currency={currency}
        onCurrencyChange={(next) => {
          setCurrency(next)
          currencyChanged(next)
        }}
        value="123.45"
        onChange={amountChanged}
        aria-label="Amount"
      />
    )
  }
  render(
    <TooltipProvider>
      <Selectable />
    </TooltipProvider>,
  )
  const trigger = screen.getByRole('combobox', { name: 'Currency, USD' })

  await user.click(trigger)
  const search = await screen.findByRole('combobox', { name: 'Search currencies…' })

  expect(search).toHaveAttribute('data-variant', 'search')
  await user.type(search, 'Japanese')
  expect(screen.queryByRole('option', { name: /US Dollar/ })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Clear currency search' }))
  expect(search).toHaveValue('')
  await user.click(screen.getByRole('option', { name: /JPY/ }))
  expect(currencyChanged).toHaveBeenCalledWith(CurrencyEnum.Jpy)
  expect(amountChanged).not.toHaveBeenCalled()
  expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('123.45')
  await waitFor(() => expect(trigger).toHaveFocus())
  await user.click(trigger)
  await screen.findByRole('combobox', { name: 'Search currencies…' })
  await user.keyboard('{Escape}')
  expect(screen.getByRole('textbox')).toHaveValue('123.45')
})
it.each([true, false])('disables both targets through prop or fieldset (prop=%s)', async (prop) => {
  const user = userEvent.setup()

  render(
    <fieldset disabled={!prop}>
      <AmountInputV2
        mode="selectable"
        currencyOptions={options}
        currency={CurrencyEnum.Usd}
        onCurrencyChange={jest.fn()}
        value="12"
        onChange={jest.fn()}
        disabled={prop}
        aria-label="Amount"
      />
    </fieldset>,
  )
  expect(screen.getByRole('textbox')).toBeDisabled()
  const trigger = screen.getByRole('combobox')

  expect(trigger).toBeDisabled()
  await user.click(trigger)
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})
it('read-only has no interactive currency selector', async () => {
  const user = userEvent.setup()
  const change = jest.fn()

  render(
    <AmountInputV2
      mode="selectable"
      currencyOptions={options}
      currency={CurrencyEnum.Usd}
      onCurrencyChange={change}
      value="12"
      onChange={change}
      readOnly
      aria-label="Amount"
    />,
  )
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  await user.type(screen.getByRole('textbox'), '3')
  expect(screen.getByRole('textbox')).toHaveValue('12')
  expect(change).not.toHaveBeenCalled()
})

it('external reset cancels a pending composition draft', () => {
  const change = jest.fn()
  const props = { currency: CurrencyEnum.Usd, onChange: change, 'aria-label': 'Amount' }
  const { rerender } = render(<AmountInputV2 {...props} value="12" />)
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '123' } })
  rerender(<AmountInputV2 {...props} value="0" />)
  expect(input).toHaveValue('0')
  fireEvent.compositionEnd(input)
  expect(change).not.toHaveBeenCalled()
})
