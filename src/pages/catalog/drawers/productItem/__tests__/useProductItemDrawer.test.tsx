import { act, renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { render } from '~/test-utils'

import { useProductItemDrawer } from '../useProductItemDrawer'

type CapturedDrawerArgs = {
  title?: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  form?: { id: string; submit: () => void | Promise<void> }
  closeOnSubmitSuccess?: boolean
}

const mockOpen = jest.fn<void, [CapturedDrawerArgs]>()
const mockClose = jest.fn()

// Mock the NiceModal-backed drawer hook so Jest never loads the drawer stack
// (drawerStack.ts uses import.meta and crashes Jest) and we can capture the
// args the hook passes to `open`.
jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

describe('useProductItemDrawer', () => {
  beforeEach(() => {
    mockOpen.mockClear()
    mockClose.mockClear()
  })

  it('opens the drawer with the create title, form id and content', () => {
    const { result } = renderHook(() => useProductItemDrawer())

    act(() => result.current.openDrawer())

    expect(mockOpen).toHaveBeenCalledTimes(1)

    const openArgs = mockOpen.mock.calls[0][0]

    expect(openArgs.title).toBe('text_1783622030703m9jlurg4jsn')
    expect(openArgs.form?.id).toBe('product-item-drawer-form')
    expect(typeof openArgs.form?.submit).toBe('function')
    expect(openArgs.children).toBeDefined()
  })

  it('keeps close ownership in the drawer so a failed save leaves it open', () => {
    const { result } = renderHook(() => useProductItemDrawer())

    act(() => result.current.openDrawer())

    expect(mockOpen.mock.calls[0][0].closeOnSubmitSuccess).toBe(false)
  })

  it('renders a type="submit" main action instead of an own onClick handler', () => {
    const { result } = renderHook(() => useProductItemDrawer())

    act(() => result.current.openDrawer())
    const openArgs = mockOpen.mock.calls[0][0]

    render(<>{openArgs.mainAction}</>)

    expect(screen.getByRole('button', { name: 'text_1742230191029lznwj3y41nb' })).toHaveAttribute(
      'type',
      'submit',
    )
  })

  it('closes the drawer when the scaffold submit succeeds', async () => {
    const { result } = renderHook(() => useProductItemDrawer())

    act(() => result.current.openDrawer())
    const openArgs = mockOpen.mock.calls[0][0]

    await act(async () => {
      await openArgs.form?.submit()
    })

    expect(mockClose).toHaveBeenCalledTimes(1)
  })
})
