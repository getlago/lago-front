import { act, fireEvent, render, screen } from '@testing-library/react'

import { ComboboxText } from '../combobox/text'
import { TooltipProvider } from '../tooltip'

const label = 'Taylor Anderson with a long display name'
let width = 120
let resize: ResizeObserverCallback
const disconnect = jest.fn()

beforeEach(() => {
  width = 120
  jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(() => ({ width }) as DOMRect)
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    measureText: (value: string) => ({ width: value.length * 10 }),
  } as CanvasRenderingContext2D)
  jest.spyOn(globalThis, 'ResizeObserver').mockImplementation((callback) => {
    resize = callback
    return { observe: jest.fn(), unobserve: jest.fn(), disconnect }
  })
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
})

it('keeps the last five characters and full accessible and copied text when truncated', () => {
  render(
    <TooltipProvider>
      <ComboboxText>{label}</ComboboxText>
    </TooltipProvider>,
  )
  const text = screen.getByLabelText(label)
  const setData = jest.fn()

  expect(text.lastElementChild).toHaveTextContent('Taylor… name')
  fireEvent.copy(text, { clipboardData: { setData } })
  expect(setData).toHaveBeenCalledWith('text/plain', label)
})

it('restores the full label when resized and disconnects on unmount', () => {
  const { unmount } = render(
    <TooltipProvider>
      <ComboboxText>{label}</ComboboxText>
    </TooltipProvider>,
  )

  expect(screen.getByLabelText(label).lastElementChild).toHaveTextContent('Taylor… name')
  width = 1000
  act(() => resize([], {} as ResizeObserver))
  expect(screen.getByLabelText(label).lastElementChild).toHaveTextContent(label)
  unmount()
  expect(disconnect).toHaveBeenCalled()
})

it('remeasures when the selected label changes', () => {
  const { rerender } = render(
    <TooltipProvider>
      <ComboboxText>{label}</ComboboxText>
    </TooltipProvider>,
  )

  rerender(
    <TooltipProvider>
      <ComboboxText>Sam</ComboboxText>
    </TooltipProvider>,
  )
  expect(screen.getByLabelText('Sam').lastElementChild).toHaveTextContent(/^Sam$/)
})
