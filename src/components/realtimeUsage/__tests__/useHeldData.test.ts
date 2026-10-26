import { renderHook } from '@testing-library/react'

import { useHeldData } from '../useHeldData'

type Props = { data?: string; heldKey: string; hasError: boolean }

const renderHeldData = (initialProps: Props) =>
  renderHook(({ data, heldKey, hasError }: Props) => useHeldData(data, heldKey, hasError), {
    initialProps,
  })

describe('useHeldData', () => {
  it('returns the data served', () => {
    const { result } = renderHeldData({ data: 'first', heldKey: 'page=1', hasError: false })

    expect(result.current).toEqual({ data: 'first', isHeld: false })
  })

  it('holds the last data while a refresh of the same key is in flight', () => {
    const { result, rerender } = renderHeldData({
      data: 'first',
      heldKey: 'page=1',
      hasError: false,
    })

    rerender({ data: undefined, heldKey: 'page=1', hasError: false })

    expect(result.current).toEqual({ data: 'first', isHeld: true })

    rerender({ data: 'second', heldKey: 'page=1', hasError: false })

    expect(result.current).toEqual({ data: 'second', isHeld: false })
  })

  it('does not hold data for another key', () => {
    const { result, rerender } = renderHeldData({
      data: 'first',
      heldKey: 'page=1',
      hasError: false,
    })

    rerender({ data: undefined, heldKey: 'page=2', hasError: false })

    expect(result.current).toEqual({ data: undefined, isHeld: false })
  })

  it('does not hold data past a failed request', () => {
    const { result, rerender } = renderHeldData({
      data: 'first',
      heldKey: 'page=1',
      hasError: false,
    })

    rerender({ data: undefined, heldKey: 'page=1', hasError: true })

    expect(result.current).toEqual({ data: undefined, isHeld: false })
  })

  it('does not resurrect the pre-error data while a retry is in flight', () => {
    const { result, rerender } = renderHeldData({
      data: 'first',
      heldKey: 'page=1',
      hasError: false,
    })

    rerender({ data: undefined, heldKey: 'page=1', hasError: true })
    rerender({ data: undefined, heldKey: 'page=1', hasError: false })

    expect(result.current).toEqual({ data: undefined, isHeld: false })

    rerender({ data: 'second', heldKey: 'page=1', hasError: false })

    expect(result.current).toEqual({ data: 'second', isHeld: false })
  })
})
