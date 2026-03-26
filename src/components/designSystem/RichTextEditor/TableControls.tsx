import { Editor, useEditorState } from '@tiptap/react'
import { tw } from 'lago-design-system'
import { useCallback, useEffect, useRef, useState } from 'react'

export const TABLE_CONTROLS_WRAPPER_TEST_ID = 'table-controls-wrapper'
export const TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID = 'table-controls-delete-row-button'
export const TABLE_CONTROLS_DELETE_COL_BUTTON_TEST_ID = 'table-controls-delete-col-button'
export const TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID = 'table-controls-add-col-button'
export const TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID = 'table-controls-add-row-button'

type TableControlsProps = {
  editor: Editor
}

type RowInfo = { top: number; height: number; cellPos: number }
type ColInfo = { left: number; width: number; cellPos: number }
type TableLayout = {
  tableX: number
  tableY: number
  tableWidth: number
  tableHeight: number
  rows: RowInfo[]
  cols: ColInfo[]
}

const HIDE_DELAY = 200
const CONTROL_OFFSET = 26 // 22px button + 4px gap
const CONTROL_GAP = 4

const TableControls = ({ editor }: TableControlsProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<TableLayout | null>(null)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)
  const [addRowVisible, setAddRowVisible] = useState(false)
  const [addColVisible, setAddColVisible] = useState(false)

  // Refs to hold hide timeouts so we can cancel them
  const hideRowTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideColTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideAddRowTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideAddColTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAllTimeouts = () => {
    if (hideRowTimeout.current) clearTimeout(hideRowTimeout.current)
    if (hideColTimeout.current) clearTimeout(hideColTimeout.current)
    if (hideAddRowTimeout.current) clearTimeout(hideAddRowTimeout.current)
    if (hideAddColTimeout.current) clearTimeout(hideAddColTimeout.current)
  }

  const showRow = (i: number) => {
    if (hideRowTimeout.current) clearTimeout(hideRowTimeout.current)
    setHoveredRow(i)
  }

  const hideRow = () => {
    hideRowTimeout.current = setTimeout(() => setHoveredRow(null), HIDE_DELAY)
  }

  const showCol = (i: number) => {
    if (hideColTimeout.current) clearTimeout(hideColTimeout.current)
    setHoveredCol(i)
  }

  const hideCol = () => {
    hideColTimeout.current = setTimeout(() => setHoveredCol(null), HIDE_DELAY)
  }

  const showAddRow = () => {
    if (hideAddRowTimeout.current) clearTimeout(hideAddRowTimeout.current)
    setAddRowVisible(true)
  }

  const hideAddRow = () => {
    hideAddRowTimeout.current = setTimeout(() => setAddRowVisible(false), HIDE_DELAY)
  }

  const showAddCol = () => {
    if (hideAddColTimeout.current) clearTimeout(hideAddColTimeout.current)
    setAddColVisible(true)
  }

  const hideAddCol = () => {
    hideAddColTimeout.current = setTimeout(() => setAddColVisible(false), HIDE_DELAY)
  }

  const isInTable = useEditorState({
    editor,
    selector: ({ editor: e }) => e.isActive('table'),
  })

  const computeLayout = useCallback((): TableLayout | null => {
    if (!wrapperRef.current) return null

    const { selection } = editor.state
    const domNode = editor.view.domAtPos(selection.from).node
    const tableEl =
      domNode instanceof HTMLElement
        ? domNode.closest('table')
        : domNode.parentElement?.closest('table')

    if (!tableEl) return null

    const wrapperRect = wrapperRef.current.getBoundingClientRect()
    const tRect = tableEl.getBoundingClientRect()

    const tableX = tRect.x - wrapperRect.x
    const tableY = tRect.y - wrapperRect.y

    const trElements = tableEl.querySelectorAll('tr')
    const rows: RowInfo[] = []

    trElements.forEach((tr) => {
      const trRect = tr.getBoundingClientRect()
      const firstCell = tr.querySelector('th, td')

      if (!firstCell) return

      const cellPos = editor.view.posAtDOM(firstCell, 0)

      rows.push({
        top: trRect.y - wrapperRect.y,
        height: trRect.height,
        cellPos,
      })
    })

    const firstRow = tableEl.querySelector('tr')
    const cols: ColInfo[] = []

    if (firstRow) {
      const cells = firstRow.querySelectorAll('th, td')

      cells.forEach((cell) => {
        const cellRect = cell.getBoundingClientRect()
        const cellPos = editor.view.posAtDOM(cell, 0)

        cols.push({
          left: cellRect.x - wrapperRect.x,
          width: cellRect.width,
          cellPos,
        })
      })
    }

    return {
      tableX,
      tableY,
      tableWidth: tRect.width,
      tableHeight: tRect.height,
      rows,
      cols,
    }
  }, [editor])

  const updateLayout = useCallback(() => {
    if (!isInTable) {
      setLayout(null)

      return
    }
    setLayout(computeLayout())
  }, [isInTable, computeLayout])

  useEffect(() => {
    updateLayout()

    editor.on('selectionUpdate', updateLayout)
    editor.on('update', updateLayout)

    return () => {
      editor.off('selectionUpdate', updateLayout)
      editor.off('update', updateLayout)
    }
  }, [editor, updateLayout])

  // Track hovered row/col from actual table cell hover
  useEffect(() => {
    if (!isInTable) {
      clearAllTimeouts()
      setHoveredRow(null)
      setHoveredCol(null)
      setAddRowVisible(false)
      setAddColVisible(false)

      return
    }

    const { selection } = editor.state
    const domNode = editor.view.domAtPos(selection.from).node
    const tableEl =
      domNode instanceof HTMLElement
        ? domNode.closest('table')
        : domNode.parentElement?.closest('table')

    if (!tableEl) return

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement
      const cell = target.closest('th, td')

      if (!cell) return

      const row = cell.closest('tr')

      if (!row) return

      const allRows = tableEl.querySelectorAll('tr')
      const firstRow = tableEl.querySelector('tr')

      // Find row index
      let rowIndex: number | null = null

      allRows.forEach((tr, i) => {
        if (tr === row) rowIndex = i
      })

      // Find column index within the row
      const rowCells = row.querySelectorAll('th, td')
      let cellIndex: number | null = null

      rowCells.forEach((c, i) => {
        if (c === cell) cellIndex = i
      })

      // Show row delete when hovering the first cell of the row
      if (cellIndex === 0 && rowIndex !== null) {
        showRow(rowIndex)
      } else {
        hideRow()
      }

      // Show column delete when hovering a cell in the first row
      if (row === firstRow && cellIndex !== null) {
        showCol(cellIndex)
      } else {
        hideCol()
      }

      // Show add-row when hovering any cell in the last row
      if (rowIndex === allRows.length - 1) {
        showAddRow()
      } else {
        hideAddRow()
      }

      // Show add-col when hovering the last cell of any row
      if (cellIndex === rowCells.length - 1) {
        showAddCol()
      } else {
        hideAddCol()
      }
    }

    const handleMouseLeave = () => {
      hideRow()
      hideCol()
      hideAddRow()
      hideAddCol()
    }

    tableEl.addEventListener('mouseover', handleMouseOver)
    tableEl.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      tableEl.removeEventListener('mouseover', handleMouseOver)
      tableEl.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isInTable, editor, layout])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => clearAllTimeouts()
  }, [])

  const focusCellAndRun = (
    cellPos: number,
    command: (chain: ReturnType<Editor['chain']>) => void,
  ) => {
    const chain = editor.chain().focus().setTextSelection(cellPos)

    command(chain)
    chain.run()
  }

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none absolute inset-0"
      data-test={TABLE_CONTROLS_WRAPPER_TEST_ID}
    >
      {isInTable && layout && (
        <>
          {/* Row delete buttons — left of each row */}
          {layout.rows.length > 1 &&
            layout.rows.map((row, i) => (
              <div
                key={`row-${row.cellPos}`}
                role="presentation"
                className={tw(
                  'absolute flex w-[22px] flex-col items-center justify-center gap-0.5 transition-opacity duration-150 ease-in-out',
                  {
                    'pointer-events-auto opacity-100': hoveredRow === i,
                    'pointer-events-none opacity-0': hoveredRow !== i,
                  },
                )}
                style={{
                  left: layout.tableX - CONTROL_OFFSET,
                  top: row.top,
                  height: row.height,
                }}
                onMouseEnter={() => showRow(i)}
                onMouseLeave={hideRow}
              >
                <button
                  type="button"
                  data-test={`${TABLE_CONTROLS_DELETE_ROW_BUTTON_TEST_ID}-${i}`}
                  className="flex size-[18px] items-center justify-center rounded bg-red-100 text-xs font-medium leading-none text-red-600 transition-colors hover:bg-red-200 hover:text-red-700"
                  title="Delete row"
                  onClick={() => focusCellAndRun(row.cellPos, (chain) => chain.deleteRow())}
                >
                  −
                </button>
              </div>
            ))}

          {/* Column delete buttons — top of each column */}
          {layout.cols.length > 1 &&
            layout.cols.map((col, i) => (
              <div
                key={`col-${col.cellPos}`}
                role="presentation"
                className={`absolute flex h-[22px] flex-row items-center justify-center gap-0.5 transition-opacity duration-150 ease-in-out ${
                  hoveredCol === i
                    ? 'pointer-events-auto opacity-100'
                    : 'pointer-events-none opacity-0'
                }`}
                style={{
                  left: col.left,
                  top: layout.tableY - CONTROL_OFFSET,
                  width: col.width,
                }}
                onMouseEnter={() => showCol(i)}
                onMouseLeave={hideCol}
              >
                <button
                  type="button"
                  data-test={`${TABLE_CONTROLS_DELETE_COL_BUTTON_TEST_ID}-${i}`}
                  className="flex size-[18px] items-center justify-center rounded bg-red-100 text-xs font-medium leading-none text-red-600 transition-colors hover:bg-red-200 hover:text-red-700"
                  title="Delete column"
                  onClick={() => focusCellAndRun(col.cellPos, (chain) => chain.deleteColumn())}
                >
                  −
                </button>
              </div>
            ))}

          {/* Add column button — right edge */}
          <button
            type="button"
            data-test={TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID}
            className={`absolute flex w-5 items-center justify-center rounded bg-grey-100 text-lg font-medium text-grey-500 transition-[opacity,background-color,color] duration-150 ease-in-out hover:bg-grey-200 hover:text-grey-700 ${
              addColVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            style={{
              left: layout.tableX + layout.tableWidth + CONTROL_GAP,
              top: layout.tableY,
              height: layout.tableHeight,
            }}
            onMouseEnter={showAddCol}
            onMouseLeave={hideAddCol}
            onClick={() => {
              const lastCol = layout.cols[layout.cols.length - 1]

              if (lastCol) {
                focusCellAndRun(lastCol.cellPos, (chain) => chain.addColumnAfter())
              }
            }}
            title="Add column"
          >
            +
          </button>

          {/* Add row button — bottom edge */}
          <button
            type="button"
            data-test={TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID}
            className={`absolute flex h-5 items-center justify-center rounded bg-grey-100 text-lg font-medium text-grey-500 transition-[opacity,background-color,color] duration-150 ease-in-out hover:bg-grey-200 hover:text-grey-700 ${
              addRowVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            style={{
              left: layout.tableX,
              top: layout.tableY + layout.tableHeight + CONTROL_GAP,
              width: layout.tableWidth,
            }}
            onMouseEnter={showAddRow}
            onMouseLeave={hideAddRow}
            onClick={() => {
              const lastRow = layout.rows[layout.rows.length - 1]

              if (lastRow) {
                focusCellAndRun(lastRow.cellPos, (chain) => chain.addRowAfter())
              }
            }}
            title="Add row"
          >
            +
          </button>
        </>
      )}
    </div>
  )
}

export default TableControls
