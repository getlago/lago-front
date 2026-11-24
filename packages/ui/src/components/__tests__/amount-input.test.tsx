import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'

import { AmountInput, AmountInputProps } from '../amount-input'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '../field'
import { TooltipProvider } from '../tooltip'

function Controlled({
  formatValue,
  ...props
}: Pick<AmountInputProps, 'formatValue'> & { value?: string }): JSX.Element {
  const [value, setValue] = useState(props.value ?? '')

  return (
    <AmountInput
      currency="USD"
      value={value}
      onChange={setValue}
      formatValue={formatValue}
      aria-label="Amount"
    />
  )
}

it('accepts, transforms, rejects and clears through the supplied callback without app providers', () => {
  const formatter = jest.fn((raw: string): string | null => {
    if (raw === 'invalid') return null
    return raw === '.5' ? '0.5' : raw
  })

  render(<Controlled formatValue={formatter} />)
  const input = screen.getByRole('textbox')

  fireEvent.change(input, { target: { value: '.5' } })
  expect(input).toHaveValue('0.5')
  fireEvent.change(input, { target: { value: 'invalid' } })
  expect(input).toHaveValue('0.5')
  fireEvent.change(input, { target: { value: '0' } })
  expect(input).toHaveValue('0')
  fireEvent.change(input, { target: { value: '' } })
  expect(input).toHaveValue('')
  expect(formatter.mock.calls.map(([raw]) => raw)).toEqual(['.5', 'invalid', '0', ''])
})

it('does not format external values or a currency change and uses the latest callback on the next edit', () => {
  const first = jest.fn((raw: string): string => raw)
  const second = jest.fn((): string => '9')
  const change = jest.fn()
  const { rerender } = render(
    <AmountInput currency="USD" value="1.2345" onChange={change} formatValue={first} />,
  )

  rerender(<AmountInput currency="JPY" value="1.2345" onChange={change} formatValue={second} />)
  expect(first).not.toHaveBeenCalled()
  expect(second).not.toHaveBeenCalled()
  expect(screen.getByRole('textbox')).toHaveValue('1.2345')
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '9.99' } })
  expect(second).toHaveBeenCalledWith('9.99')
  expect(change).toHaveBeenCalledWith('9', expect.anything())
})

it('preserves the IME draft across new callback identities and commits with the latest policy', () => {
  const change = jest.fn()
  const { rerender } = render(
    <AmountInput currency="USD" value="" onChange={change} formatValue={(raw) => raw} />,
  )
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '.5' } })
  rerender(
    <AmountInput
      currency="USD"
      value=""
      onChange={change}
      formatValue={(raw) => (raw === '.5' ? '0.5' : raw)}
    />,
  )
  expect(input).toHaveValue('.5')
  expect(change).not.toHaveBeenCalled()
  fireEvent.compositionEnd(input)
  expect(change).toHaveBeenCalledWith('0.5', expect.anything())
})

it('deduplicates trailing IME input despite inline callbacks on every controlled render', () => {
  const changed = jest.fn()

  function Inline(): JSX.Element {
    const [value, setValue] = useState('')

    return (
      <AmountInput
        currency="USD"
        value={value}
        formatValue={(raw) => (raw === '.5' ? '0.5' : raw)}
        onChange={(next) => {
          changed(next)
          setValue(next)
        }}
      />
    )
  }
  render(<Inline />)
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '.5' } })
  fireEvent.compositionEnd(input)
  fireEvent.change(input, { target: { value: '.5' } })
  expect(changed).toHaveBeenCalledTimes(1)
  expect(input).toHaveValue('0.5')
})

it('does not swallow an edit when formatting policy changes for the same currency', () => {
  const change = jest.fn()
  const { rerender } = render(
    <Controlled formatValue={(raw) => (raw === '1.234' ? '1.23' : raw)} />,
  )
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '1.234' } })
  fireEvent.compositionEnd(input)
  rerender(
    <Controlled
      formatValue={(raw) => {
        change(raw)
        return raw
      }}
    />,
  )
  fireEvent.change(input, { target: { value: '1.234' } })
  expect(input).toHaveValue('1.234')
  expect(change).toHaveBeenCalledWith('1.234')
})

it('uses supplied localized selector labels and preserves an explicit empty placeholder', async () => {
  const user = userEvent.setup()

  render(
    <AmountInput
      currency="USD"
      value=""
      onChange={jest.fn()}
      formatValue={(raw) => raw}
      placeholder=""
      mode="selectable"
      currencyOptions={[]}
      onCurrencyChange={jest.fn()}
      currencyLabels={{
        trigger: 'Devise',
        search: 'Rechercher',
        clear: 'Effacer',
        empty: 'Aucune devise',
      }}
    />,
  )
  expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '')
  await user.click(screen.getByRole('combobox', { name: 'Devise' }))
  expect(await screen.findByRole('combobox', { name: 'Rechercher' })).toHaveAttribute(
    'placeholder',
    'Rechercher',
  )
  expect(screen.getByRole('status')).toHaveTextContent('Aucune devise')
})

const selectableDefaults = {
  formatValue: (raw: string): string => raw,
  currencyLabels: {
    trigger: 'Currency, USD',
    search: 'Search currencies…',
    clear: 'Clear currency search',
    empty: 'No currencies found',
  },
}
const options = [
  { value: 'USD', label: 'US Dollar' },
  { value: 'JPY', label: 'Japanese Yen' },
]

beforeEach(() => {
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(256)
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(56)
})
afterEach(() => jest.restoreAllMocks())

it('composes a labelled invalid Field and exposes the native input ref', async () => {
  const ref = createRef<HTMLInputElement>()
  const user = userEvent.setup()

  render(
    <Field>
      <FieldContent>
        <FieldLabel htmlFor="amount">Price</FieldLabel>
        <FieldDescription id="help">In USD</FieldDescription>
      </FieldContent>
      <AmountInput
        formatValue={(raw) => raw}
        id="amount"
        ref={ref}
        currency="USD"
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
it('searches names, clears query only, and changes currency without changing amount', async () => {
  const user = userEvent.setup()
  const amountChanged = jest.fn()
  const currencyChanged = jest.fn()

  function Selectable(): JSX.Element {
    const [currency, setCurrency] = useState('USD')

    return (
      <AmountInput
        {...selectableDefaults}
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
  expect(currencyChanged).toHaveBeenCalledWith('JPY')
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
      <AmountInput
        {...selectableDefaults}
        mode="selectable"
        currencyOptions={options}
        currency="USD"
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
    <AmountInput
      {...selectableDefaults}
      mode="selectable"
      currencyOptions={options}
      currency="USD"
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
  const props = {
    currency: 'USD',
    onChange: change,
    'aria-label': 'Amount',
    formatValue: (raw: string): string => raw,
  }
  const { rerender } = render(<AmountInput {...props} value="12" />)
  const input = screen.getByRole('textbox')

  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '123' } })
  rerender(<AmountInput {...props} value="0" />)
  expect(input).toHaveValue('0')
  fireEvent.compositionEnd(input)
  expect(change).not.toHaveBeenCalled()
})

it('updates currency labels and search when the caller replaces options', async () => {
  const user = userEvent.setup()
  const props: AmountInputProps = {
    ...selectableDefaults,
    mode: 'selectable',
    currency: 'USD',
    currencyOptions: options,
    onCurrencyChange: jest.fn(),
    value: '123.45',
    onChange: jest.fn(),
    'aria-label': 'Amount',
  }
  const { rerender } = render(<AmountInput {...props} />)

  await user.click(screen.getByRole('combobox', { name: 'Currency, USD' }))
  const search = await screen.findByRole('combobox', { name: 'Search currencies…' })

  await user.type(search, 'Japanese')
  expect(await screen.findByRole('option', { name: 'JPY Japanese Yen' })).toBeInTheDocument()
  rerender(
    <AmountInput
      {...props}
      currencyOptions={[
        { value: 'USD', label: 'US Dollar' },
        { value: 'JPY', label: 'Yen japonais' },
      ]}
    />,
  )
  await waitFor(() => expect(screen.queryByRole('option')).not.toBeInTheDocument())
  await user.clear(search)
  await user.type(search, 'japonais')
  expect(await screen.findByRole('option', { name: 'JPY Yen japonais' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('123.45')
})

it('does not rescan currency options when only the amount changes', () => {
  const readCurrency = jest.fn(() => 'USD')
  const currencyOptions = [
    {
      get value() {
        return readCurrency()
      },
      label: 'US Dollar',
    },
  ]
  const props: AmountInputProps = {
    ...selectableDefaults,
    mode: 'selectable',
    currency: 'USD',
    currencyOptions,
    onCurrencyChange: jest.fn(),
    value: '12',
    onChange: jest.fn(),
  }
  const { rerender } = render(<AmountInput {...props} />)
  const initialReads = readCurrency.mock.calls.length

  expect(initialReads).toBeGreaterThan(0)
  rerender(<AmountInput {...props} value="123" />)
  expect(screen.getByRole('textbox')).toHaveValue('123')
  expect(readCurrency).toHaveBeenCalledTimes(initialReads)
})

it('restores a selected range after the caller rejects a paste', async () => {
  const user = userEvent.setup()

  render(<Controlled value="123.45" formatValue={(raw) => (raw.includes('x') ? null : raw)} />)
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
