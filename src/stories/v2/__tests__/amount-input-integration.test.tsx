import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AmountInput, AmountInputProps, CurrencyOption } from 'lago-ui/amount-input'
import { TooltipProvider } from 'lago-ui/tooltip'
import { createRef, forwardRef, useState } from 'react'

import {
  AmountFormattingOptions,
  definedDefaultPlaceholder,
  defineNewBeforeChangeFormatter,
} from '~/components/form/AmountInput/formatting'
import { formatValue } from '~/components/form/TextInput/formatValue'
import { initializeTranslations } from '~/core/apolloClient/reactiveVars/internationalizationVar'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type TestAmountProps = Omit<
  AmountInputProps<CurrencyEnum>,
  'formatValue' | 'currencyLabels' | 'mode' | 'currencyOptions' | 'onCurrencyChange'
> &
  AmountFormattingOptions &
  (
    | { mode?: 'fixed' }
    | {
        mode: 'selectable'
        currencyOptions: readonly CurrencyOption<CurrencyEnum>[]
        onCurrencyChange: (currency: CurrencyEnum) => void
      }
  )
const TestAmount = forwardRef<HTMLInputElement, TestAmountProps>(
  ({ beforeChangeFormatter, chargePricingUnitShortName, ...props }, ref): JSX.Element => {
    const { translate } = useInternationalization()
    const formatters = defineNewBeforeChangeFormatter({
      currency: props.currency,
      beforeChangeFormatter,
      chargePricingUnitShortName,
    })
    const mode =
      props.mode === 'selectable'
        ? {
            ...props,
            currencyLabels: {
              trigger: `Currency, ${props.currency}`,
              search: 'Search currencies…',
              clear: 'Clear currency search',
              empty: 'No currencies found',
            },
          }
        : props

    return (
      <AmountInput
        {...mode}
        ref={ref}
        formatValue={(raw) => formatValue(raw, formatters)}
        placeholder={
          props.placeholder ??
          definedDefaultPlaceholder({
            currency: props.currency,
            chargePricingUnitShortName,
            translate,
          })
        }
      />
    )
  },
)

TestAmount.displayName = 'TestAmount'

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
  props: Partial<Omit<TestAmountProps, 'mode' | 'currencyOptions' | 'onCurrencyChange'>>,
): JSX.Element {
  const [value, setValue] = useState(props.value ?? '')

  return (
    <TestAmount
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
    <TestAmount
      currency={CurrencyEnum.Clf}
      value="123.4567"
      onChange={change}
      aria-label="Amount"
    />,
  )

  rerender(
    <TestAmount
      currency={CurrencyEnum.Jpy}
      value="123.4567"
      onChange={change}
      aria-label="Amount"
    />,
  )
  expect(screen.getByRole('textbox')).toHaveValue('123.4567')
  expect(change).not.toHaveBeenCalled()
  rerender(
    <TestAmount currency={CurrencyEnum.Jpy} value={0} onChange={change} aria-label="Amount" />,
  )
  expect(screen.getByRole('textbox')).toHaveValue('0')
  rerender(
    <TestAmount
      currency={CurrencyEnum.Jpy}
      value={undefined}
      onChange={change}
      aria-label="Amount"
    />,
  )
  expect(screen.getByRole('textbox')).toHaveValue('')
})

it('virtualizes all currencies and selects a filtered offscreen currency with the keyboard', async () => {
  const user = userEvent.setup()
  const currencies = Object.values(CurrencyEnum)
  const changed = jest.fn()
  const amountChanged = jest.fn()

  render(
    <TooltipProvider>
      <TestAmount
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

it('restores the caret after a rejected edit in an iframe document', () => {
  const frame = document.createElement('iframe')

  document.body.append(frame)
  const body = frame.contentDocument?.body

  if (!body) throw new Error('Missing iframe document')
  const container = body.ownerDocument.createElement('div')

  body.append(container)
  const ref = createRef<HTMLInputElement>()
  const view = render(
    <TestAmount ref={ref} currency={CurrencyEnum.Usd} value="12.30" onChange={jest.fn()} />,
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
  const { rerender } = render(<TestAmount {...props} value="12" />)
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '123' } })
  rerender(<TestAmount {...props} value="0" />)
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
      <TestAmount
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

it.each([
  [CurrencyEnum.Usd, '50', 0, '0.50', '0.15'],
  [CurrencyEnum.Usd, '100', 0, '0.10', '0.11'],
  [CurrencyEnum.Usd, '-50', 1, '-0.50', '-0.15'],
  [CurrencyEnum.Bhd, '50', 0, '0.50', '0.150'],
])(
  'keeps the caret after a normalized decimal in %s %s',
  async (currency, value, position, normalized, next) => {
    const user = userEvent.setup()

    render(<Controlled currency={currency} value={value} />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    await user.click(input)
    input.setSelectionRange(position, position)
    await user.keyboard('.')
    expect(input).toHaveValue(normalized)
    expect(input.selectionStart).toBe(position + 2)
    expect(input.selectionEnd).toBe(position + 2)
    await user.keyboard('1')
    expect(input).toHaveValue(next)
    expect(input.selectionStart).toBe(position + 3)
  },
)

it('maps a pasted leading decimal after removing repeated minus signs', async () => {
  const user = userEvent.setup()

  render(<Controlled value="50" beforeChangeFormatter="positiveNumber" />)
  const input = screen.getByRole('textbox') as HTMLInputElement

  await user.click(input)
  input.setSelectionRange(0, 0)
  await user.paste('--.')
  expect(input).toHaveValue('0.50')
  expect(input.selectionStart).toBe(2)
  await user.keyboard('1')
  expect(input).toHaveValue('0.15')
})

it('maps both selection endpoints across an inserted decimal zero', () => {
  render(<Controlled value="50" />)
  const input = screen.getByRole('textbox') as HTMLInputElement

  input.focus()
  fireEvent.change(input, { target: { value: '.50', selectionStart: 1, selectionEnd: 2 } })
  expect(input).toHaveValue('0.50')
  expect(input.selectionStart).toBe(2)
  expect(input.selectionEnd).toBe(3)
})

it('keeps the caret before repeated integer zeros removed by formatting', async () => {
  const user = userEvent.setup()

  render(<Controlled currency={CurrencyEnum.Jpy} value="10" />)
  const input = screen.getByRole('textbox') as HTMLInputElement

  await user.click(input)
  input.setSelectionRange(0, 0)
  await user.keyboard('0')
  expect(input).toHaveValue('10')
  expect(input.selectionStart).toBe(0)
  await user.keyboard('2')
  expect(input).toHaveValue('210')
})
