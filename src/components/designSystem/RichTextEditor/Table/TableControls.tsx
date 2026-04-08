import type { Editor } from '@tiptap/core'
import { CellSelection } from '@tiptap/pm/tables'
import { useEditorState } from '@tiptap/react'
import { Icon } from 'lago-design-system'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

import ColorPicker from '../BlockControls/ColorPicker'
import { getDragHandleStorage } from '../extensions/DragHandle'

export const TABLE_CONTROLS_WRAPPER_TEST_ID = 'table-controls-wrapper'
export const TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID = 'table-controls-add-col-button'
export const TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID = 'table-controls-add-row-button'
export const TABLE_CONTROLS_ROW_MENU_BUTTON_TEST_ID = 'table-controls-row-menu-button'
export const TABLE_CONTROLS_COL_MENU_BUTTON_TEST_ID = 'table-controls-col-menu-button'

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

const BORDER_ZONE_SIZE = 14

// --- Utility functions (module-level to reduce component complexity) ---

const resolveCellPos = (editor: Editor, contentPos: number) => {
  // cellPos from posAtDOM points inside the cell content.
  // Walk up to find the cell node position for CellSelection.
  const $pos = editor.state.doc.resolve(contentPos)

  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth)

    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      return editor.state.doc.resolve($pos.before(depth))
    }
  }

  return $pos
}

const selectRow = (editor: Editor, cellPos: number) => {
  const $cell = resolveCellPos(editor, cellPos)
  const selection = CellSelection.rowSelection($cell)
  const tr = editor.state.tr.setSelection(selection)

  editor.view.dispatch(tr)
  editor.view.focus()
}

const selectColumn = (editor: Editor, cellPos: number) => {
  const $cell = resolveCellPos(editor, cellPos)
  const selection = CellSelection.colSelection($cell)
  const tr = editor.state.tr.setSelection(selection)

  editor.view.dispatch(tr)
  editor.view.focus()
}

const focusCellAndRun = (
  editor: Editor,
  cellPos: number,
  command: (chain: ReturnType<Editor['chain']>) => void,
) => {
  const chain = editor.chain().focus().setTextSelection(cellPos)

  command(chain)
  chain.run()
}

// --- Extracted sub-components ---

type TableMenuOpenerProps = {
  variant: 'row' | 'col'
  isSelected: boolean
  index: number
  onSelect: () => void
  onClick?: () => void
}

const TableMenuOpener = forwardRef<HTMLButtonElement, TableMenuOpenerProps>(
  function TableMenuOpener({ variant, isSelected, index, onSelect, onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={`table-controls__menu-btn table-controls__menu-btn--${variant} ${isSelected ? 'is-selected' : ''}`}
        data-test={`${variant === 'row' ? TABLE_CONTROLS_ROW_MENU_BUTTON_TEST_ID : TABLE_CONTROLS_COL_MENU_BUTTON_TEST_ID}-${index}`}
        title={variant === 'row' ? 'Row options' : 'Column options'}
        onClick={() => {
          onSelect()
          onClick?.()
        }}
      >
        <Icon
          name={variant === 'row' ? 'double-dots-vertical' : 'double-dots-horizontal'}
          size="small"
        />
      </button>
    )
  },
)

type RowMenuContentProps = {
  cellPos: number
  rowIndex: number
  totalRows: number
  rowColors: { backgroundColor: string | null; textColor: string | null } | null
  editor: Editor
  closePopper: () => void
}

const RowMenuContent = ({
  cellPos,
  rowIndex,
  totalRows,
  rowColors,
  editor,
  closePopper,
}: RowMenuContentProps) => {
  const { translate } = useInternationalization()

  return (
    <MenuPopper>
      {/* Colors */}
      <Popper
        PopperProps={{ placement: 'right-start' }}
        opener={
          <Button variant="quaternary" align="left" className="w-full" startIcon="text-color">
            {translate('text_17751458820889ebguo3021w')}
          </Button>
        }
      >
        {() => (
          <MenuPopper>
            <ColorPicker
              activeBackgroundColor={rowColors?.backgroundColor ?? null}
              activeTextColor={rowColors?.textColor ?? null}
              onSelectBackground={(color) => {
                focusCellAndRun(editor, cellPos, () => {
                  editor.commands.setRowBackgroundColor(color)
                })
              }}
              onSelectText={(color) => {
                focusCellAndRun(editor, cellPos, () => {
                  editor.commands.setRowTextColor(color)
                })
              }}
            />
          </MenuPopper>
        )}
      </Popper>

      {/* Move up */}
      <Button
        variant="quaternary"
        startIcon="arrow-top"
        align="left"
        disabled={rowIndex === 0}
        onClick={() => {
          focusCellAndRun(editor, cellPos, () => {
            editor.commands.moveRowUp()
          })
          closePopper()
        }}
      >
        {translate('text_17756354158189xlxmul84lu')}
      </Button>

      {/* Move down */}
      <Button
        variant="quaternary"
        startIcon="arrow-bottom"
        align="left"
        disabled={rowIndex === totalRows - 1}
        onClick={() => {
          focusCellAndRun(editor, cellPos, () => {
            editor.commands.moveRowDown()
          })
          closePopper()
        }}
      >
        {translate('text_1775635415819dqd4uqcq6jl')}
      </Button>

      {/* Delete row */}
      {totalRows > 1 && (
        <Button
          variant="quaternary"
          startIcon="trash"
          align="left"
          onClick={() => {
            focusCellAndRun(editor, cellPos, (chain) => chain.deleteRow())
            closePopper()
          }}
        >
          {translate('text_17756367818356w28cspf5y7')}
        </Button>
      )}
    </MenuPopper>
  )
}

type ColMenuContentProps = {
  cellPos: number
  colIndex: number
  totalCols: number
  editor: Editor
  closePopper: () => void
}

const ColMenuContent = ({
  cellPos,
  colIndex,
  totalCols,
  editor,
  closePopper,
}: ColMenuContentProps) => {
  const { translate } = useInternationalization()

  return (
    <MenuPopper>
      {/* Colors */}
      <Popper
        PopperProps={{ placement: 'right-start' }}
        opener={
          <Button variant="quaternary" align="left" className="w-full" startIcon="text-color">
            {translate('text_17751458820889ebguo3021w')}
          </Button>
        }
      >
        {() => (
          <MenuPopper>
            <ColorPicker
              activeBackgroundColor={null}
              activeTextColor={null}
              onSelectBackground={(color) => {
                focusCellAndRun(editor, cellPos, () => {
                  editor.commands.setColumnBackgroundColor(color)
                })
              }}
              onSelectText={(color) => {
                focusCellAndRun(editor, cellPos, () => {
                  editor.commands.setColumnTextColor(color)
                })
              }}
            />
          </MenuPopper>
        )}
      </Popper>

      {/* Move left */}
      <Button
        variant="quaternary"
        startIcon="arrow-left"
        align="left"
        disabled={colIndex === 0}
        onClick={() => {
          focusCellAndRun(editor, cellPos, () => {
            editor.commands.moveColumnLeft()
          })
          closePopper()
        }}
      >
        {translate('text_1775636781835mcmnvqltjb1')}
      </Button>

      {/* Move right */}
      <Button
        variant="quaternary"
        startIcon="arrow-right"
        align="left"
        disabled={colIndex === totalCols - 1}
        onClick={() => {
          focusCellAndRun(editor, cellPos, () => {
            editor.commands.moveColumnRight()
          })
          closePopper()
        }}
      >
        {translate('text_1775636781835jw4g7ynklb3')}
      </Button>

      {/* Delete column */}
      {totalCols > 1 && (
        <Button
          variant="quaternary"
          startIcon="trash"
          align="left"
          onClick={() => {
            focusCellAndRun(editor, cellPos, (chain) => chain.deleteColumn())
            closePopper()
          }}
        >
          {translate('text_1775636781835fuo9er4u938')}
        </Button>
      )}
    </MenuPopper>
  )
}

// --- Main component ---

const TableControls = ({ editor }: TableControlsProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<TableLayout | null>(null)

  const isInTable = useEditorState({
    editor,
    selector: ({ editor: e }) => e.isActive('table'),
  })

  // Derive the focused row/col index from the cursor position.
  // Skip when a CellSelection is active or when table is block-selected via drag handle.
  const focusedCell = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e.isActive('table')) return null
      if (e.state.selection instanceof CellSelection) return null
      if (getDragHandleStorage(e).selectedBlock) return null

      const $pos = e.state.selection.$from
      let rowIndex: number | null = null
      let colIndex: number | null = null

      for (let depth = $pos.depth; depth > 0; depth--) {
        const node = $pos.node(depth)

        if (node.type.name === 'table') {
          rowIndex = $pos.index(depth)
        }
        if (node.type.name === 'tableRow') {
          colIndex = $pos.index(depth)
        }
      }

      if (rowIndex !== null && colIndex !== null) {
        return { rowIndex, colIndex }
      }

      return null
    },
  })

  // Detect if a row or column CellSelection is active and which indices are selected
  const cellSelection = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const { selection } = e.state

      if (!(selection instanceof CellSelection)) return null

      if (selection.isRowSelection()) {
        // Find which row indices are selected
        const selectedRows = new Set<number>()

        selection.forEachCell((_node, pos) => {
          const $pos = e.state.doc.resolve(pos)

          for (let depth = $pos.depth; depth > 0; depth--) {
            if ($pos.node(depth).type.name === 'table') {
              selectedRows.add($pos.index(depth))
              break
            }
          }
        })

        return { type: 'row' as const, indices: selectedRows }
      }

      if (selection.isColSelection()) {
        // Find which column indices are selected
        const selectedCols = new Set<number>()

        selection.forEachCell((_node, pos) => {
          const $pos = e.state.doc.resolve(pos)

          for (let depth = $pos.depth; depth > 0; depth--) {
            if ($pos.node(depth).type.name === 'tableRow') {
              selectedCols.add($pos.index(depth))
              break
            }
          }
        })

        return { type: 'col' as const, indices: selectedCols }
      }

      return null
    },
  })

  const selectedRows = useMemo(
    () => (cellSelection?.type === 'row' ? cellSelection.indices : null),
    [cellSelection],
  )

  const selectedCols = useMemo(
    () => (cellSelection?.type === 'col' ? cellSelection.indices : null),
    [cellSelection],
  )

  const rowColors = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e.isActive('table')) return null

      const $pos = e.state.selection.$from

      for (let depth = $pos.depth; depth > 0; depth--) {
        const node = $pos.node(depth)

        if (node.type.name === 'tableRow') {
          return {
            backgroundColor:
              typeof node.attrs.backgroundColor === 'string' ? node.attrs.backgroundColor : null,
            textColor: typeof node.attrs.textColor === 'string' ? node.attrs.textColor : null,
          }
        }
      }

      return null
    },
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

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none absolute inset-0"
      data-test={TABLE_CONTROLS_WRAPPER_TEST_ID}
    >
      {isInTable && layout && (
        <>
          {/* Row border zones — left of each row */}
          {layout.rows.map((row, i) => (
            <div
              key={`row-zone-${row.cellPos}`}
              className="table-controls__row-border-zone"
              data-focused={focusedCell?.rowIndex === i || undefined}
              style={{
                left: layout.tableX,
                top: row.top,
                width: BORDER_ZONE_SIZE,
                height: row.height,
              }}
            >
              <Popper
                PopperProps={{ placement: 'right' }}
                opener={
                  <TableMenuOpener
                    variant="row"
                    isSelected={selectedRows?.has(i) ?? false}
                    index={i}
                    onSelect={() => selectRow(editor, row.cellPos)}
                  />
                }
              >
                {({ closePopper }) => (
                  <RowMenuContent
                    cellPos={row.cellPos}
                    rowIndex={i}
                    totalRows={layout.rows.length}
                    rowColors={rowColors}
                    editor={editor}
                    closePopper={closePopper}
                  />
                )}
              </Popper>
            </div>
          ))}

          {/* Column border zones — top of each column */}
          {layout.cols.map((col, i) => (
            <div
              key={`col-zone-${col.cellPos}`}
              className="table-controls__col-border-zone"
              data-focused={focusedCell?.colIndex === i || undefined}
              style={{
                left: col.left,
                top: layout.tableY,
                width: col.width,
                height: BORDER_ZONE_SIZE,
              }}
            >
              <Popper
                PopperProps={{ placement: 'right' }}
                opener={
                  <TableMenuOpener
                    variant="col"
                    isSelected={selectedCols?.has(i) ?? false}
                    index={i}
                    onSelect={() => selectColumn(editor, col.cellPos)}
                  />
                }
              >
                {({ closePopper }) => (
                  <ColMenuContent
                    cellPos={col.cellPos}
                    colIndex={i}
                    totalCols={layout.cols.length}
                    editor={editor}
                    closePopper={closePopper}
                  />
                )}
              </Popper>
            </div>
          ))}

          {/* Add column zone — right edge */}
          <div
            className="table-controls__add-zone table-controls__add-col-zone"
            style={{
              left: layout.tableX + layout.tableWidth,
              top: layout.tableY,
              width: 20,
              height: layout.tableHeight,
            }}
          >
            <button
              type="button"
              className="table-controls__add-btn table-controls__add-col"
              data-test={TABLE_CONTROLS_ADD_COL_BUTTON_TEST_ID}
              title="Add column"
              style={{ height: '100%' }}
              onClick={() => {
                const lastCol = layout.cols[layout.cols.length - 1]

                if (lastCol) {
                  focusCellAndRun(editor, lastCol.cellPos, (chain) => chain.addColumnAfter())
                }
              }}
            >
              +
            </button>
          </div>

          {/* Add row zone — bottom edge */}
          <div
            className="table-controls__add-zone table-controls__add-row-zone"
            style={{
              left: layout.tableX,
              top: layout.tableY + layout.tableHeight,
              width: layout.tableWidth,
              height: 20,
            }}
          >
            <button
              type="button"
              className="table-controls__add-btn table-controls__add-row"
              data-test={TABLE_CONTROLS_ADD_ROW_BUTTON_TEST_ID}
              title="Add row"
              style={{ width: '100%' }}
              onClick={() => {
                const lastRow = layout.rows[layout.rows.length - 1]

                if (lastRow) {
                  focusCellAndRun(editor, lastRow.cellPos, (chain) => chain.addRowAfter())
                }
              }}
            >
              +
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default TableControls
