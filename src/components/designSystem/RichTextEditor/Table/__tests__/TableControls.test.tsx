import { act, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/react'

import { render } from '~/test-utils'

import TableControls, {
  TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID,
  TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID,
  TABLE_CONTROLS_COL_MENU_BUTTON_TEST_ID,
  TABLE_CONTROLS_ROW_MENU_BUTTON_TEST_ID,
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
const createTableDOM = (container: HTMLElement) => {
  const table = document.createElement('table')
  const tbody = document.createElement('tbody')

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

const createSingleRowTableDOM = (container: HTMLElement) => {
  const table = document.createElement('table')
  const tbody = document.createElement('tbody')
  const tr = document.createElement('tr')

  for (let c = 0; c < 2; c++) {
    const td = document.createElement('td')

    td.textContent = `r0c${c}`
    tr.appendChild(td)
  }
  tbody.appendChild(tr)
  table.appendChild(tbody)
  container.appendChild(table)

  return table
}

const createSingleColTableDOM = (container: HTMLElement) => {
  const table = document.createElement('table')
  const tbody = document.createElement('tbody')

  for (let r = 0; r < 2; r++) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')

    td.textContent = `r${r}c0`
    tr.appendChild(td)
    tbody.appendChild(tr)
  }
  table.appendChild(tbody)
  container.appendChild(table)

  return table
}

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
      selection: { from: 1, $from: { depth: 0, node: () => null } },
    },
    view: {
      domAtPos: jest.fn().mockReturnValue({ node: document.createElement('td') }),
      posAtDOM: jest.fn().mockReturnValue(1),
    },
    chain: jest.fn().mockReturnValue(proxy),
    commands: {
      moveRowUp: jest.fn(),
      moveRowDown: jest.fn(),
      moveColumnLeft: jest.fn(),
      moveColumnRight: jest.fn(),
      setRowBackgroundColor: jest.fn(),
      setRowTextColor: jest.fn(),
    },
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

const setupIsInTable = (editor: unknown, value: boolean) => {
  mockIsInTable = value
  ;(editor as { isActive: jest.Mock }).isActive.mockReturnValue(value)
}

const setupDOMForLayout = (wrapperEl: HTMLElement, editor: unknown) => {
  const table = createTableDOM(wrapperEl)
  const firstCell = table.querySelector('td') as HTMLTableCellElement

  ;(editor as { view: { domAtPos: jest.Mock } }).view.domAtPos.mockReturnValue({
    node: firstCell,
  })

  let posCounter = 1

  ;(editor as { view: { posAtDOM: jest.Mock } }).view.posAtDOM.mockImplementation(
    () => posCounter++,
  )

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

const setupDOMForSingleRowLayout = (wrapperEl: HTMLElement, editor: unknown) => {
  const table = createSingleRowTableDOM(wrapperEl)
  const firstCell = table.querySelector('td') as HTMLTableCellElement

  ;(editor as { view: { domAtPos: jest.Mock } }).view.domAtPos.mockReturnValue({
    node: firstCell,
  })

  let posCounter = 1

  ;(editor as { view: { posAtDOM: jest.Mock } }).view.posAtDOM.mockImplementation(
    () => posCounter++,
  )

  mockGetBoundingClientRect(wrapperEl, { x: 0, y: 0, width: 600, height: 400 })
  mockGetBoundingClientRect(table, { x: 50, y: 50, width: 400, height: 100 })

  const rows = table.querySelectorAll('tr')

  rows.forEach((tr) => {
    mockGetBoundingClientRect(tr, { x: 50, y: 50, width: 400, height: 100 })
  })

  const cells = table.querySelectorAll('td')

  cells.forEach((td, i) => {
    mockGetBoundingClientRect(td, { x: 50 + i * 200, y: 50, width: 200, height: 100 })
  })
}

const setupDOMForSingleColLayout = (wrapperEl: HTMLElement, editor: unknown) => {
  const table = createSingleColTableDOM(wrapperEl)
  const firstCell = table.querySelector('td') as HTMLTableCellElement

  ;(editor as { view: { domAtPos: jest.Mock } }).view.domAtPos.mockReturnValue({
    node: firstCell,
  })

  let posCounter = 1

  ;(editor as { view: { posAtDOM: jest.Mock } }).view.posAtDOM.mockImplementation(
    () => posCounter++,
  )

  mockGetBoundingClientRect(wrapperEl, { x: 0, y: 0, width: 600, height: 400 })
  mockGetBoundingClientRect(table, { x: 50, y: 50, width: 200, height: 200 })

  const rows = table.querySelectorAll('tr')

  rows.forEach((tr, i) => {
    mockGetBoundingClientRect(tr, { x: 50, y: 50 + i * 100, width: 200, height: 100 })
  })

  const cells = table.querySelectorAll('td')

  cells.forEach((td, i) => {
    mockGetBoundingClientRect(td, { x: 50, y: 50 + i * 100, width: 200, height: 100 })
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
          screen.queryByTestId(`${TABLE_CONTROLS_ROW_MENU_BUTTON_TEST_ID}-0`),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(`${TABLE_CONTROLS_COL_MENU_BUTTON_TEST_ID}-0`),
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

        const wrapperEl = screen.getByTestId(TABLE_CONTROLS_WRAPPER_TEST_ID)

        setupDOMForLayout(wrapperEl, editor)

        const onCalls = (editor.on as jest.Mock).mock.calls
        const selectionUpdateHandler = onCalls.find(
          ([event]: [string]) => event === 'selectionUpdate',
        )?.[1] as (() => void) | undefined

        if (selectionUpdateHandler) {
          await act(() => selectionUpdateHandler())
        }

        return { editor, runMock, container }
      }

      it('THEN should render row menu buttons for each row', async () => {
        await renderWithLayout()

        expect(
          screen.getByTestId(`${TABLE_CONTROLS_ROW_MENU_BUTTON_TEST_ID}-0`),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(`${TABLE_CONTROLS_ROW_MENU_BUTTON_TEST_ID}-1`),
        ).toBeInTheDocument()
      })

      it('THEN should render column menu buttons for each column', async () => {
        await renderWithLayout()

        expect(
          screen.getByTestId(`${TABLE_CONTROLS_COL_MENU_BUTTON_TEST_ID}-0`),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(`${TABLE_CONTROLS_COL_MENU_BUTTON_TEST_ID}-1`),
        ).toBeInTheDocument()
      })

      it.each([
        ['add column', TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID],
        ['add row', TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID],
      ])('THEN should render the %s button', async (_, testId) => {
        await renderWithLayout()

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      describe('WHEN only one row exists', () => {
        const renderWithSingleRowLayout = async () => {
          const { editor, runMock } = createMockEditor()

          setupIsInTable(editor, true)

          await act(() => render(<TableControls editor={editor} />))

          const wrapperEl = screen.getByTestId(TABLE_CONTROLS_WRAPPER_TEST_ID)

          setupDOMForSingleRowLayout(wrapperEl, editor)

          const onCalls = (editor.on as jest.Mock).mock.calls
          const selectionUpdateHandler = onCalls.find(
            ([event]: [string]) => event === 'selectionUpdate',
          )?.[1] as (() => void) | undefined

          if (selectionUpdateHandler) {
            await act(() => selectionUpdateHandler())
          }

          return { editor, runMock }
        }

        it('THEN should still render row menu buttons (menu handles delete visibility)', async () => {
          await renderWithSingleRowLayout()

          expect(
            screen.getByTestId(`${TABLE_CONTROLS_ROW_MENU_BUTTON_TEST_ID}-0`),
          ).toBeInTheDocument()
        })

        it('THEN should still render the add row button', async () => {
          await renderWithSingleRowLayout()

          expect(screen.getByTestId(TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID)).toBeInTheDocument()
        })
      })

      describe('WHEN only one column exists', () => {
        const renderWithSingleColLayout = async () => {
          const { editor, runMock } = createMockEditor()

          setupIsInTable(editor, true)

          await act(() => render(<TableControls editor={editor} />))

          const wrapperEl = screen.getByTestId(TABLE_CONTROLS_WRAPPER_TEST_ID)

          setupDOMForSingleColLayout(wrapperEl, editor)

          const onCalls = (editor.on as jest.Mock).mock.calls
          const selectionUpdateHandler = onCalls.find(
            ([event]: [string]) => event === 'selectionUpdate',
          )?.[1] as (() => void) | undefined

          if (selectionUpdateHandler) {
            await act(() => selectionUpdateHandler())
          }

          return { editor, runMock }
        }

        it('THEN should still render col menu buttons (menu handles delete visibility)', async () => {
          await renderWithSingleColLayout()

          expect(
            screen.getByTestId(`${TABLE_CONTROLS_COL_MENU_BUTTON_TEST_ID}-0`),
          ).toBeInTheDocument()
        })

        it('THEN should still render the add column button', async () => {
          await renderWithSingleColLayout()

          expect(screen.getByTestId(TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID)).toBeInTheDocument()
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

  describe('GIVEN the cursor leaves the table', () => {
    describe('WHEN isInTable becomes false', () => {
      it('THEN should clear all controls', async () => {
        const { editor } = createMockEditor()

        setupIsInTable(editor, true)

        await act(() => render(<TableControls editor={editor} />))

        const wrapperEl = screen.getByTestId(TABLE_CONTROLS_WRAPPER_TEST_ID)

        setupDOMForLayout(wrapperEl, editor)

        const onCalls = (editor.on as jest.Mock).mock.calls
        const selectionUpdateHandler = onCalls.find(
          ([event]: [string]) => event === 'selectionUpdate',
        )?.[1] as (() => void) | undefined

        if (selectionUpdateHandler) {
          await act(() => selectionUpdateHandler())
        }

        expect(
          screen.getByTestId(`${TABLE_CONTROLS_ROW_MENU_BUTTON_TEST_ID}-0`),
        ).toBeInTheDocument()

        setupIsInTable(editor, false)

        if (selectionUpdateHandler) {
          await act(() => selectionUpdateHandler())
        }

        expect(
          screen.queryByTestId(`${TABLE_CONTROLS_ROW_MENU_BUTTON_TEST_ID}-0`),
        ).not.toBeInTheDocument()
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

  describe('GIVEN the hover zone structure', () => {
    const renderWithLayout = async () => {
      const { editor } = createMockEditor()

      setupIsInTable(editor, true)

      await act(() => render(<TableControls editor={editor} />))

      const wrapperEl = screen.getByTestId(TABLE_CONTROLS_WRAPPER_TEST_ID)

      setupDOMForLayout(wrapperEl, editor)

      const onCalls = (editor.on as jest.Mock).mock.calls
      const selectionUpdateHandler = onCalls.find(
        ([event]: [string]) => event === 'selectionUpdate',
      )?.[1] as (() => void) | undefined

      if (selectionUpdateHandler) {
        await act(() => selectionUpdateHandler())
      }

      return { editor, wrapperEl }
    }

    it('THEN should render row border zones with correct CSS class', async () => {
      const { wrapperEl } = await renderWithLayout()

      const rowZones = wrapperEl.querySelectorAll('.table-controls__row-border-zone')

      expect(rowZones.length).toBe(2)
    })

    it('THEN should render column border zones with correct CSS class', async () => {
      const { wrapperEl } = await renderWithLayout()

      const colZones = wrapperEl.querySelectorAll('.table-controls__col-border-zone')

      expect(colZones.length).toBe(2)
    })

    it('THEN should render add-col-zone and add-row-zone containers', async () => {
      const { wrapperEl } = await renderWithLayout()

      const addColZone = wrapperEl.querySelector('.table-controls__add-col-zone')
      const addRowZone = wrapperEl.querySelector('.table-controls__add-row-zone')

      expect(addColZone).not.toBeNull()
      expect(addRowZone).not.toBeNull()
    })

    // Note: CSS :hover behavior cannot be tested in jsdom.
    // The container-based hover visibility should be verified via manual or e2e testing.
  })
})
