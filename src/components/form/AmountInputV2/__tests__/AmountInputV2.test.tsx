import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
beforeEach(() => {
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(256)
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(56)
})
afterEach(() => jest.restoreAllMocks())
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

it('virtualizes all currencies and selects a filtered offscreen currency with the keyboard', async () => {
  const user = userEvent.setup()
  const currencies = Object.values(CurrencyEnum)
  const changed = jest.fn()
  const amountChanged = jest.fn()

  render(
    <TooltipProvider>
      <AmountInputV2
        mode="selectable"
        currencyOptions={currencies.map((value) => ({ value, label: value }))}
        currency={CurrencyEnum.Usd}
        onCurrencyChange={changed}
        value="123.45"
        onChange={amountChanged}
        aria-label="Amount"
      />
    </TooltipProvider>,
  )
  await user.click(screen.getByRole('combobox', { name: 'Currency, USD' }))
  const search = await screen.findByRole('combobox', { name: 'Search currencies…' })
  const rendered = await screen.findAllByRole('option')

  expect(rendered.length).toBeLessThan(20)
  expect(rendered[0]).toHaveAttribute('aria-setsize', String(currencies.length))
  expect(screen.queryByRole('option', { name: /ZMW/ })).not.toBeInTheDocument()
  await user.type(search, 'ZMW')
  expect(await screen.findByRole('option', { name: /ZMW/ })).toHaveAttribute('aria-setsize', '1')
  await user.keyboard('{ArrowDown}{Enter}')
  expect(changed).toHaveBeenCalledWith(CurrencyEnum.Zmw)
  expect(amountChanged).not.toHaveBeenCalled()
  expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('123.45')
})

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

it('updates currency labels and search when the caller replaces options', async () => {
  const user = userEvent.setup()
  const props: AmountInputV2Props = {
    mode: 'selectable',
    currency: CurrencyEnum.Usd,
    currencyOptions: options,
    onCurrencyChange: jest.fn(),
    value: '123.45',
    onChange: jest.fn(),
    'aria-label': 'Amount',
  }
  const { rerender } = render(<AmountInputV2 {...props} />)

  await user.click(screen.getByRole('combobox', { name: 'Currency, USD' }))
  const search = await screen.findByRole('combobox', { name: 'Search currencies…' })

  await user.type(search, 'Japanese')
  expect(await screen.findByRole('option', { name: 'JPY Japanese Yen' })).toBeInTheDocument()
  rerender(
    <AmountInputV2
      {...props}
      currencyOptions={[
        { value: CurrencyEnum.Usd, label: 'US Dollar' },
        { value: CurrencyEnum.Jpy, label: 'Yen japonais' },
      ]}
    />,
  )
  await waitFor(() => expect(screen.queryByRole('option')).not.toBeInTheDocument())
  await user.clear(search)
  await user.type(search, 'japonais')
  expect(await screen.findByRole('option', { name: 'JPY Yen japonais' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('123.45')
})

it('restores the caret after a rejected edit in an iframe document', () => {
  const frame = document.createElement('iframe')

  document.body.append(frame)
  const body = frame.contentDocument?.body

  if (!body) throw new Error('Missing iframe document')
  const container = body.ownerDocument.createElement('div')

  body.append(container)
  const ref = createRef<HTMLInputElement>()
  const view = render(
    <AmountInputV2 ref={ref} currency={CurrencyEnum.Usd} value="12.30" onChange={jest.fn()} />,
    { container },
  )
  const input = ref.current

  if (!input) throw new Error('Missing amount input')
  try {
    input.focus()
    fireEvent.change(input, { target: { value: '1x2.30', selectionStart: 2, selectionEnd: 2 } })
    expect(input).toHaveValue('12.30')
    expect(input.selectionStart).toBe(1)
    expect(input.selectionEnd).toBe(1)
  } finally {
    view.unmount()
    frame.remove()
  }
})

it('does not rescan currency options when only the amount changes', () => {
  const readCurrency = jest.fn(() => CurrencyEnum.Usd)
  const currencyOptions = [
    {
      get value() {
        return readCurrency()
      },
      label: 'US Dollar',
    },
  ]
  const props: AmountInputV2Props = {
    mode: 'selectable',
    currency: CurrencyEnum.Usd,
    currencyOptions,
    onCurrencyChange: jest.fn(),
    value: '12',
    onChange: jest.fn(),
  }
  const { rerender } = render(<AmountInputV2 {...props} />)
  const initialReads = readCurrency.mock.calls.length

  expect(initialReads).toBeGreaterThan(0)
  rerender(<AmountInputV2 {...props} value="123" />)
  expect(screen.getByRole('textbox')).toHaveValue('123')
  expect(readCurrency).toHaveBeenCalledTimes(initialReads)
})

it.each([
  [CurrencyEnum.Jpy, undefined, '0'],
  [CurrencyEnum.Usd, 'positiveNumber' as const, '-'],
])('maps removed leading characters for %s', async (currency, beforeChangeFormatter, key) => {
  const user = userEvent.setup()

  render(
    <Controlled value="15" currency={currency} beforeChangeFormatter={beforeChangeFormatter} />,
  )
  const input = screen.getByRole('textbox') as HTMLInputElement

  await user.click(input)
  input.setSelectionRange(0, 0)
  await user.keyboard(key)
  expect(input.selectionStart).toBe(0)
  await user.keyboard('2')
  expect(input).toHaveValue('215')
})

it('restores a selected range after a rejected paste', async () => {
  const user = userEvent.setup()

  render(<Controlled value="123.45" />)
  const input = screen.getByRole('textbox') as HTMLInputElement

  await user.click(input)
  input.setSelectionRange(1, 3)
  await user.paste('x')
  expect(input).toHaveValue('123.45')
  expect(input.selectionStart).toBe(1)
  expect(input.selectionEnd).toBe(3)
  await user.keyboard('9')
  expect(input).toHaveValue('19.45')
})

it('ignores further IME changes after an external reset until composition ends', () => {
  const change = jest.fn()
  const props = { currency: CurrencyEnum.Usd, onChange: change }
  const { rerender } = render(<AmountInputV2 {...props} value="12" />)
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '123' } })
  rerender(<AmountInputV2 {...props} value="0" />)
  fireEvent.change(input, { target: { value: '1234' } })
  expect(change).not.toHaveBeenCalled()
  expect(input).toHaveValue('0')
  fireEvent.compositionEnd(input, { target: { value: '1234' } })
  fireEvent.change(input, { target: { value: '1234' } })
  expect(change).not.toHaveBeenCalled()
  fireEvent.keyDown(input, { key: '5' })
  fireEvent.change(input, { target: { value: '5' } })
  expect(change).toHaveBeenCalledWith('5', expect.anything())
})

it('does not swallow a new edit matching an old composition after currency changes', () => {
  const change = jest.fn()
  const { rerender } = render(<Controlled onChange={change} />)
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '1.239' } })
  fireEvent.compositionEnd(input)
  rerender(<Controlled currency={CurrencyEnum.Clf} onChange={change} />)
  fireEvent.change(input, { target: { value: '1.239' } })
  expect(input).toHaveValue('1.239')
  expect(change).toHaveBeenCalledTimes(2)
})

it('accepts a leading decimal typed one character at a time', async () => {
  const user = userEvent.setup()

  render(<Controlled />)
  const input = screen.getByRole('textbox')

  await user.type(input, '.5')
  expect(input).toHaveValue('0.5')
})

it('expires final-input suppression when composition has no trailing input', () => {
  jest.useFakeTimers()
  try {
    const change = jest.fn()

    render(<Controlled onChange={change} />)
    const input = screen.getByRole('textbox')

    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '1.239' } })
    fireEvent.compositionEnd(input)
    expect(change).toHaveBeenCalledTimes(1)
    act(() => jest.runOnlyPendingTimers())
    fireEvent.change(input, { target: { value: '1.239' } })
    expect(change).toHaveBeenCalledTimes(2)
  } finally {
    jest.useRealTimers()
  }
})

it('allows a new keyboard edit at the composition boundary', () => {
  const change = jest.fn()

  render(<Controlled onChange={change} />)
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '1.239' } })
  fireEvent.compositionEnd(input)
  fireEvent.keyDown(input, { key: '9' })
  fireEvent.change(input, { target: { value: '1.239' } })
  expect(change).toHaveBeenCalledTimes(2)
})

it('deduplicates final composition input with an inline formatter array', () => {
  function InlineFormatter(): JSX.Element {
    const [value, setValue] = useState('')

    return (
      <AmountInputV2
        currency={CurrencyEnum.Usd}
        value={value}
        beforeChangeFormatter={['positiveNumber']}
        onChange={(next) => {
          changed(next)
          setValue(next)
        }}
      />
    )
  }
  const changed = jest.fn()

  render(<InlineFormatter />)
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '1.239' } })
  fireEvent.compositionEnd(input)
  fireEvent.change(input, { target: { value: '1.239' } })
  expect(changed).toHaveBeenCalledTimes(1)
})
