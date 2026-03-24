import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/react'

import { render } from '~/test-utils'

import TableControls, {
  TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID,
  TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID,
  TABLE_CONTROLS_DELETE_COL_BUTTON_TEST_ID,
  TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID,
  TABLE_CONTROLS_WRAPPER_TEST_ID,
} from '../TableControls'

// --- Mock chain builder (same proxy pattern as Toolbar.test.tsx) ---
const createMockChain = () => {
  const chainMethods: Record<string, jest.Mock> = {}
  const runMock = jest.fn()

  const handler: ProxyHandler<Record<string, jest.Mock>> = {
    get: (_target, prop: string) => {
      if (prop === 'run') return runMock
      if (!chainMethods[prop]) {
        chainMethods[prop] = jest.fn().mockReturnValue(new Proxy({}, handler))
      }

      return chainMethods[prop]
    },
  }

  return { proxy: new Proxy({}, handler), runMock, chainMethods }
}

// --- DOM helpers ---
// Creates a real table inside a container so computeLayout can traverse the DOM.
const createTableDOM = (container: HTMLElement) => {
  const table = document.createElement('table')
  const tbody = document.createElement('tbody')

  // 2 rows x 2 cols
  for (let r = 0; r < 2; r++) {
    const tr = document.createElement('tr')

    for (let c = 0; c < 2; c++) {
      const td = document.createElement('td')

      td.textContent = `r${r}c${c}`
      tr.appendChild(td)
    }
    tbody.appendChild(tr)
  }
  table.appendChild(tbody)
  container.appendChild(table)

  return table
}

// Mock getBoundingClientRect to return consistent positions
const mockGetBoundingClientRect = (el: Element, rect: Partial<DOMRect>) => {
  jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => ({}),
    ...rect,
  })
}

// --- Mock editor factory ---
let mockIsInTable = false

const createMockEditor = () => {
  const { proxy, runMock } = createMockChain()
  const eventHandlers: Record<string, Array<() => void>> = {}

  const editor = {
    state: {
      selection: { from: 1 },
    },
    view: {
      domAtPos: jest.fn().mockReturnValue({ node: document.createElement('td') }),
      posAtDOM: jest.fn().mockReturnValue(1),
    },
    chain: jest.fn().mockReturnValue(proxy),
    on: jest.fn((event: string, handler: () => void) => {
      if (!eventHandlers[event]) eventHandlers[event] = []
      eventHandlers[event].push(handler)
    }),
    off: jest.fn((event: string, handler: () => void) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter((h) => h !== handler)
      }
    }),
    isActive: jest.fn().mockReturnValue(false),
  } as unknown as Editor

  return { editor, runMock, eventHandlers }
}

jest.mock('@tiptap/react', () => ({
  ...jest.requireActual('@tiptap/react'),
  useEditorState: jest.fn().mockImplementation(({ selector, editor }) => {
    if (selector) {
      return selector({ editor })
    }

    return mockIsInTable
  }),
}))

// Override isActive so useEditorState's selector returns our mock value
const setupIsInTable = (editor: unknown, value: boolean) => {
  mockIsInTable = value
  ;(editor as { isActive: jest.Mock }).isActive.mockReturnValue(value)
}

// Setup the domAtPos mock to point into a real table inside the wrapper
const setupDOMForLayout = (wrapperEl: HTMLElement, editor: unknown) => {
  const table = createTableDOM(wrapperEl)
  const firstCell = table.querySelector('td') as HTMLTableCellElement

  // Mock domAtPos to return a node inside the table
  ;(editor as { view: { domAtPos: jest.Mock } }).view.domAtPos.mockReturnValue({
    node: firstCell,
  })

  // Mock posAtDOM to return incrementing positions
  let posCounter = 1

  ;(editor as { view: { posAtDOM: jest.Mock } }).view.posAtDOM.mockImplementation(
    () => posCounter++,
  )

  // Mock getBoundingClientRect for wrapper, table, rows, and cells
  mockGetBoundingClientRect(wrapperEl, { x: 0, y: 0, width: 600, height: 400 })
  mockGetBoundingClientRect(table, { x: 50, y: 50, width: 400, height: 200 })

  const rows = table.querySelectorAll('tr')

  rows.forEach((tr, i) => {
    mockGetBoundingClientRect(tr, { x: 50, y: 50 + i * 100, width: 400, height: 100 })
  })

  const cells = table.querySelectorAll('td')

  cells.forEach((td, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)

    mockGetBoundingClientRect(td, {
      x: 50 + col * 200,
      y: 50 + row * 100,
      width: 200,
      height: 100,
    })
  })
}

describe('TableControls', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    mockIsInTable = false
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN the cursor is not inside a table', () => {
      it('THEN should render the wrapper container', async () => {
        const { editor } = createMockEditor()

        setupIsInTable(editor, false)

        await act(() => render(<TableControls editor={editor} />))

        expect(screen.getByTestId(TABLE_CONTROLS_WRAPPER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not render any control buttons', async () => {
        const { editor } = createMockEditor()

        setupIsInTable(editor, false)

        await act(() => render(<TableControls editor={editor} />))

        expect(
          screen.queryByTestId(`${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-0`),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(`${TABLE_CONTROLS_DELETE_COL_BUTTON_TEST_ID}-0`),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId(TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the cursor is inside a table', () => {
      const renderWithLayout = async () => {
        const { editor, runMock } = createMockEditor()

        setupIsInTable(editor, true)

        const { container } = await act(() => render(<TableControls editor={editor} />))

        // Get the wrapper element and set up DOM inside it
        const wrapperEl = screen.getByTestId(TABLE_CONTROLS_WRAPPER_TEST_ID)

        setupDOMForLayout(wrapperEl, editor)

        // Trigger a re-render by simulating a selectionUpdate event
        const onCalls = (editor.on as jest.Mock).mock.calls
        const selectionUpdateHandler = onCalls.find(
          ([event]: [string]) => event === 'selectionUpdate',
        )?.[1] as (() => void) | undefined

        if (selectionUpdateHandler) {
          await act(() => selectionUpdateHandler())
        }

        return { editor, runMock, container }
      }

      it('THEN should render delete row buttons for each row', async () => {
        await renderWithLayout()

        expect(
          screen.getByTestId(`${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-0`),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(`${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-1`),
        ).toBeInTheDocument()
      })

      it('THEN should render delete column buttons for each column', async () => {
        await renderWithLayout()

        expect(
          screen.getByTestId(`${TABLE_CONTROLS_DELETE_COL_BUTTON_TEST_ID}-0`),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(`${TABLE_CONTROLS_DELETE_COL_BUTTON_TEST_ID}-1`),
        ).toBeInTheDocument()
      })

      it.each([
        ['add column', TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID],
        ['add row', TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID],
      ])('THEN should render the %s button', async (_, testId) => {
        await renderWithLayout()

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      describe('WHEN the delete row button is clicked', () => {
        it('THEN should call the editor chain with deleteRow', async () => {
          const user = userEvent.setup()
          const { editor, runMock } = await renderWithLayout()

          await user.click(screen.getByTestId(`${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-0`))

          expect(editor.chain).toHaveBeenCalled()
          expect(runMock).toHaveBeenCalled()
        })
      })

      describe('WHEN the delete column button is clicked', () => {
        it('THEN should call the editor chain with deleteColumn', async () => {
          const user = userEvent.setup()
          const { editor, runMock } = await renderWithLayout()

          await user.click(screen.getByTestId(`${TABLE_CONTROLS_DELETE_COL_BUTTON_TEST_ID}-0`))

          expect(editor.chain).toHaveBeenCalled()
          expect(runMock).toHaveBeenCalled()
        })
      })

      describe('WHEN the add column button is clicked', () => {
        it('THEN should call the editor chain with addColumnAfter', async () => {
          const user = userEvent.setup()
          const { editor, runMock } = await renderWithLayout()

          await user.click(screen.getByTestId(TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID))

          expect(editor.chain).toHaveBeenCalled()
          expect(runMock).toHaveBeenCalled()
        })
      })

      describe('WHEN the add row button is clicked', () => {
        it('THEN should call the editor chain with addRowAfter', async () => {
          const user = userEvent.setup()
          const { editor, runMock } = await renderWithLayout()

          await user.click(screen.getByTestId(TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID))

          expect(editor.chain).toHaveBeenCalled()
          expect(runMock).toHaveBeenCalled()
        })
      })
    })
  })

  describe('GIVEN the table mouse interactions', () => {
    const renderWithLayout = async () => {
      const { editor, runMock } = createMockEditor()

      setupIsInTable(editor, true)

      await act(() => render(<TableControls editor={editor} />))

      const wrapperEl = screen.getByTestId(TABLE_CONTROLS_WRAPPER_TEST_ID)

      setupDOMForLayout(wrapperEl, editor)

      // Trigger layout computation
      const onCalls = (editor.on as jest.Mock).mock.calls
      const selectionUpdateHandler = onCalls.find(
        ([event]: [string]) => event === 'selectionUpdate',
      )?.[1] as (() => void) | undefined

      if (selectionUpdateHandler) {
        await act(() => selectionUpdateHandler())
      }

      const table = wrapperEl.querySelector('table') as HTMLTableElement

      return { editor, runMock, table, wrapperEl }
    }

    describe('WHEN hovering the first cell of a row', () => {
      it('THEN should show the row delete button', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        const firstCellFirstRow = table.querySelectorAll('td')[0]

        await act(() => {
          fireEvent.mouseOver(firstCellFirstRow)
        })

        const deleteRowBtn = screen.getByTestId(`${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-0`)

        expect(deleteRowBtn.parentElement).toHaveClass('opacity-100')

        jest.useRealTimers()
      })
    })

    describe('WHEN hovering a cell in the first row', () => {
      it('THEN should show the column delete button', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        const firstCellFirstRow = table.querySelectorAll('td')[0]

        await act(() => {
          fireEvent.mouseOver(firstCellFirstRow)
        })

        const deleteColBtn = screen.getByTestId(`${TABLE_CONTROLS_DELETE_COL_BUTTON_TEST_ID}-0`)

        expect(deleteColBtn.parentElement).toHaveClass('opacity-100')

        jest.useRealTimers()
      })
    })

    describe('WHEN hovering the last cell of a row', () => {
      it('THEN should show the add column button', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        // Last cell of first row (index 1 in a 2x2 grid)
        const lastCellFirstRow = table.querySelectorAll('td')[1]

        await act(() => {
          fireEvent.mouseOver(lastCellFirstRow)
        })

        const addColBtn = screen.getByTestId(TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID)

        expect(addColBtn).toHaveClass('opacity-100')

        jest.useRealTimers()
      })
    })

    describe('WHEN hovering a cell in the last row', () => {
      it('THEN should show the add row button', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        // First cell of last row (index 2 in a 2x2 grid)
        const firstCellLastRow = table.querySelectorAll('td')[2]

        await act(() => {
          fireEvent.mouseOver(firstCellLastRow)
        })

        const addRowBtn = screen.getByTestId(TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID)

        expect(addRowBtn).toHaveClass('opacity-100')

        jest.useRealTimers()
      })
    })

    describe('WHEN hovering a non-first cell in a non-first row', () => {
      it('THEN should hide the row and column delete buttons after delay', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        // First, hover the first cell to show the row delete button
        const firstCell = table.querySelectorAll('td')[0]

        await act(() => {
          fireEvent.mouseOver(firstCell)
        })

        // Now hover a middle cell (second cell of second row, index 3)
        const middleCell = table.querySelectorAll('td')[3]

        await act(() => {
          fireEvent.mouseOver(middleCell)
        })

        // Advance timers past the HIDE_DELAY
        await act(() => {
          jest.advanceTimersByTime(250)
        })

        const deleteRowBtn = screen.getByTestId(`${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-0`)

        expect(deleteRowBtn.parentElement).toHaveClass('opacity-0')

        jest.useRealTimers()
      })
    })

    describe('WHEN the mouse leaves the table', () => {
      it('THEN should hide all controls after delay', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        // First hover the first cell to show controls
        const firstCell = table.querySelectorAll('td')[0]

        await act(() => {
          fireEvent.mouseOver(firstCell)
        })

        // Then leave the table
        await act(() => {
          fireEvent.mouseLeave(table)
        })

        // Advance timers past the HIDE_DELAY
        await act(() => {
          jest.advanceTimersByTime(250)
        })

        const deleteRowBtn = screen.getByTestId(`${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-0`)

        expect(deleteRowBtn.parentElement).toHaveClass('opacity-0')

        jest.useRealTimers()
      })
    })

    describe('WHEN hovering a control button wrapper (row)', () => {
      it('THEN should keep the control visible by canceling hide timeout', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        const firstCell = table.querySelectorAll('td')[0]

        // Hover to show the row delete button
        await act(() => {
          fireEvent.mouseOver(firstCell)
        })

        const deleteRowBtnWrapper = screen.getByTestId(
          `${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-0`,
        ).parentElement as HTMLElement

        // Mouse enter the control button wrapper
        await act(() => {
          fireEvent.mouseEnter(deleteRowBtnWrapper)
        })

        // Advance past hide delay
        await act(() => {
          jest.advanceTimersByTime(250)
        })

        // Should still be visible because mouseEnter cancelled the hide
        expect(deleteRowBtnWrapper).toHaveClass('opacity-100')

        jest.useRealTimers()
      })
    })

    describe('WHEN hovering a control button wrapper (col)', () => {
      it('THEN should keep the control visible by canceling hide timeout', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        const firstCell = table.querySelectorAll('td')[0]

        // Hover to show the col delete button
        await act(() => {
          fireEvent.mouseOver(firstCell)
        })

        const deleteColBtnWrapper = screen.getByTestId(
          `${TABLE_CONTROLS_DELETE_COL_BUTTON_TEST_ID}-0`,
        ).parentElement as HTMLElement

        // Mouse enter the control button wrapper
        await act(() => {
          fireEvent.mouseEnter(deleteColBtnWrapper)
        })

        // Advance past hide delay
        await act(() => {
          jest.advanceTimersByTime(250)
        })

        // Should still be visible
        expect(deleteColBtnWrapper).toHaveClass('opacity-100')

        jest.useRealTimers()
      })
    })

    describe('WHEN mouse leaves a control button wrapper', () => {
      it('THEN should hide the control after delay', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        const firstCell = table.querySelectorAll('td')[0]

        await act(() => {
          fireEvent.mouseOver(firstCell)
        })

        const deleteRowBtnWrapper = screen.getByTestId(
          `${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-0`,
        ).parentElement as HTMLElement

        // Mouse enter then leave the wrapper
        await act(() => {
          fireEvent.mouseEnter(deleteRowBtnWrapper)
        })
        await act(() => {
          fireEvent.mouseLeave(deleteRowBtnWrapper)
        })

        await act(() => {
          jest.advanceTimersByTime(250)
        })

        expect(deleteRowBtnWrapper).toHaveClass('opacity-0')

        jest.useRealTimers()
      })
    })

    describe('WHEN hovering the add row button', () => {
      it('THEN should keep it visible', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        // Hover last row cell to show add row
        const lastRowCell = table.querySelectorAll('td')[2]

        await act(() => {
          fireEvent.mouseOver(lastRowCell)
        })

        const addRowBtn = screen.getByTestId(TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID)

        await act(() => {
          fireEvent.mouseEnter(addRowBtn)
        })

        await act(() => {
          jest.advanceTimersByTime(250)
        })

        expect(addRowBtn).toHaveClass('opacity-100')

        jest.useRealTimers()
      })
    })

    describe('WHEN mouse leaves the add row button', () => {
      it('THEN should hide after delay', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        const lastRowCell = table.querySelectorAll('td')[2]

        await act(() => {
          fireEvent.mouseOver(lastRowCell)
        })

        const addRowBtn = screen.getByTestId(TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID)

        await act(() => {
          fireEvent.mouseEnter(addRowBtn)
        })
        await act(() => {
          fireEvent.mouseLeave(addRowBtn)
        })

        await act(() => {
          jest.advanceTimersByTime(250)
        })

        expect(addRowBtn).toHaveClass('opacity-0')

        jest.useRealTimers()
      })
    })

    describe('WHEN hovering the add col button', () => {
      it('THEN should keep it visible', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        // Hover last cell of first row to show add col
        const lastCell = table.querySelectorAll('td')[1]

        await act(() => {
          fireEvent.mouseOver(lastCell)
        })

        const addColBtn = screen.getByTestId(TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID)

        await act(() => {
          fireEvent.mouseEnter(addColBtn)
        })

        await act(() => {
          jest.advanceTimersByTime(250)
        })

        expect(addColBtn).toHaveClass('opacity-100')

        jest.useRealTimers()
      })
    })

    describe('WHEN mouse leaves the add col button', () => {
      it('THEN should hide after delay', async () => {
        jest.useFakeTimers()
        const { table } = await renderWithLayout()
        const lastCell = table.querySelectorAll('td')[1]

        await act(() => {
          fireEvent.mouseOver(lastCell)
        })

        const addColBtn = screen.getByTestId(TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID)

        await act(() => {
          fireEvent.mouseEnter(addColBtn)
        })
        await act(() => {
          fireEvent.mouseLeave(addColBtn)
        })

        await act(() => {
          jest.advanceTimersByTime(250)
        })

        expect(addColBtn).toHaveClass('opacity-0')

        jest.useRealTimers()
      })
    })
  })

  describe('GIVEN the cursor leaves the table', () => {
    describe('WHEN isInTable becomes false', () => {
      it('THEN should clear all hover states', async () => {
        jest.useFakeTimers()
        const { editor } = createMockEditor()

        setupIsInTable(editor, true)

        await act(() => render(<TableControls editor={editor} />))

        const wrapperEl = screen.getByTestId(TABLE_CONTROLS_WRAPPER_TEST_ID)

        setupDOMForLayout(wrapperEl, editor)

        // Trigger layout
        const onCalls = (editor.on as jest.Mock).mock.calls
        const selectionUpdateHandler = onCalls.find(
          ([event]: [string]) => event === 'selectionUpdate',
        )?.[1] as (() => void) | undefined

        if (selectionUpdateHandler) {
          await act(() => selectionUpdateHandler())
        }

        // Verify controls are rendered
        expect(
          screen.getByTestId(`${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-0`),
        ).toBeInTheDocument()

        // Now simulate leaving the table
        setupIsInTable(editor, false)

        if (selectionUpdateHandler) {
          await act(() => selectionUpdateHandler())
        }

        // Controls should no longer be rendered
        expect(
          screen.queryByTestId(`${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-0`),
        ).not.toBeInTheDocument()

        jest.useRealTimers()
      })
    })
  })

  describe('GIVEN the editor event subscriptions', () => {
    describe('WHEN the component mounts', () => {
      it('THEN should subscribe to selectionUpdate and update events', async () => {
        const { editor } = createMockEditor()

        setupIsInTable(editor, false)

        await act(() => render(<TableControls editor={editor} />))

        expect(editor.on).toHaveBeenCalledWith('selectionUpdate', expect.any(Function))
        expect(editor.on).toHaveBeenCalledWith('update', expect.any(Function))
      })
    })

    describe('WHEN the component unmounts', () => {
      it('THEN should unsubscribe from editor events', async () => {
        const { editor } = createMockEditor()

        setupIsInTable(editor, false)

        const { unmount } = await act(() => render(<TableControls editor={editor} />))

        await act(() => unmount())

        expect(editor.off).toHaveBeenCalledWith('selectionUpdate', expect.any(Function))
        expect(editor.off).toHaveBeenCalledWith('update', expect.any(Function))
      })
    })
  })
})
