import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { AmountInput, AmountInputProps } from '../amount-input'

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
