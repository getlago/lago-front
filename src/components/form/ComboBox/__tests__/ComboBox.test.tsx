import { act, fireEvent, render, screen } from '@testing-library/react'

import { DEBOUNCE_SEARCH_MS } from '~/hooks/useDebouncedSearch'

import { ComboBox } from '../ComboBox'
import { BasicComboBoxData } from '../types'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string): string => key }),
}))

const options: BasicComboBoxData[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
]

const advanceDebounce = (): void => {
  act(() => {
    jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS)
  })
}

describe('ComboBox', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('clears a selected option when that option is removed', () => {
    const onChange = jest.fn()
    const { rerender } = render(
      <ComboBox data={options} value="alpha" allowAddValue onChange={onChange} />,
    )

    expect(onChange).not.toHaveBeenCalled()
    rerender(<ComboBox data={[options[1]]} value="alpha" allowAddValue onChange={onChange} />)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('retains the selection when only another option or a duplicate is removed', () => {
    const onChange = jest.fn()
    const { rerender } = render(
      <ComboBox data={[...options, options[0]]} value="alpha" onChange={onChange} />,
    )

    rerender(<ComboBox data={[options[0]]} value="alpha" onChange={onChange} />)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('combobox')).toHaveValue('Alpha')
  })

  it('retains a free-form value when all options are removed', () => {
    const onChange = jest.fn()
    const { rerender } = render(
      <ComboBox data={options} value="custom" allowAddValue onChange={onChange} />,
    )

    rerender(<ComboBox data={[]} value="custom" allowAddValue onChange={onChange} />)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('combobox')).toHaveValue('custom')
  })

  it('filters local options and accepts a free-form value without a query', () => {
    const onChange = jest.fn()

    render(<ComboBox data={options} allowAddValue virtualized={false} onChange={onChange} />)
    advanceDebounce()

    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'Al' } })
    expect(screen.getByRole('option', { name: /Alpha$/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Beta$/ })).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'custom' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    advanceDebounce()
    expect(onChange).toHaveBeenLastCalledWith('custom')
  })

  it('debounces typed strings and restores an unfiltered remote query on blur', () => {
    const searchQuery = jest.fn()

    render(
      <ComboBox
        data={options}
        searchQuery={searchQuery}
        virtualized={false}
        onChange={jest.fn()}
      />,
    )
    expect(searchQuery).toHaveBeenCalledTimes(1)
    advanceDebounce()

    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'alp' } })
    expect(searchQuery).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('option', { name: /Beta$/ })).toBeInTheDocument()
    advanceDebounce()
    expect(searchQuery).toHaveBeenLastCalledWith({ variables: { searchTerm: 'alp' } })

    fireEvent.blur(input)
    advanceDebounce()
    expect(searchQuery).toHaveBeenCalledTimes(3)
    expect(searchQuery).toHaveBeenLastCalledWith({ variables: { searchTerm: undefined } })
  })
})
