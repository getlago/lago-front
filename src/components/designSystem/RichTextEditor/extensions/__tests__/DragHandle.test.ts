import { Editor } from '@tiptap/core'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { NodeSelection } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import { act } from 'react'

import { getBaseExtensions } from '../baseExtensions'
import { BlockColors } from '../BlockColors'
import { DragHandle, type DragHandleStorage, resolveSelectedTable } from '../DragHandle'

const TABLE_CONTENT = `
<p>Before table</p>
<table>
  <tbody>
    <tr><td>A1</td><td>B1</td></tr>
    <tr><td>A2</td><td>B2</td></tr>
  </tbody>
</table>
<p>After table</p>
`

const createEditor = (content = '<p>First</p><p>Second</p>') => {
  let editor!: Editor

  act(() => {
    editor = new Editor({
      extensions: [StarterKit, DragHandle, BlockColors, Table, TableRow, TableCell, TableHeader],
      content,
    })
  })

  return editor
}

const getDragHandleStorage = (editor: Editor): DragHandleStorage =>
  (editor.storage as any).dragHandle as DragHandleStorage

const findTablePos = (editor: Editor): number => {
  let tablePos = -1

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'table' && tablePos === -1) {
      tablePos = pos
    }
  })

  return tablePos
}

const hasTable = (editor: Editor): boolean => findTablePos(editor) > -1

/** Clicks the grip of the table in TABLE_CONTENT (the second top-level block). */
const selectTableViaGrip = (editor: Editor): void => {
  const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

  ;(grips[1] as HTMLElement).click()
}

const pressKey = (editor: Editor, key: string): void => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

  editor.view.someProp('handleKeyDown', (f) => f(editor.view, event))
}

describe('DragHandle', () => {
  describe('GIVEN the DragHandle extension', () => {
    it('THEN should have the correct name', () => {
      expect(DragHandle.name).toBe('dragHandle')
    })
  })

  describe('GIVEN the editor is initialized with DragHandle', () => {
    describe('WHEN the document has block nodes', () => {
      it('THEN should create drag handle decorations for each top-level block', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const handles = editor.view.dom.querySelectorAll('.block-handle-group')

        editor.destroy()

        expect(handles.length).toBe(2)
      })

      it('THEN should render each handle with the grip SVG', async () => {
        const editor = createEditor('<p>Hello</p>')
        const handle = editor.view.dom.querySelector('.block-handle-group')

        // renderGripIcon is deferred via queueMicrotask to avoid nested React render warnings.
        // Flush the microtask + React render with act.
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 0))
        })

        editor.destroy()

        expect(handle).not.toBeNull()
        expect(handle?.querySelector('svg')).not.toBeNull()
      })

      it('THEN should set draggable to true on the grip button', () => {
        const editor = createEditor('<p>Hello</p>')
        const gripButton = editor.view.dom.querySelector('.block-handle-grip') as HTMLElement

        editor.destroy()

        expect(gripButton.draggable).toBe(true)
      })

      it('THEN should set contentEditable to false on each handle', () => {
        const editor = createEditor('<p>Hello</p>')
        const handle = editor.view.dom.querySelector('.block-handle-group') as HTMLElement

        editor.destroy()

        expect(handle.contentEditable).toBe('false')
      })
    })

    describe('WHEN the document changes', () => {
      it('THEN should rebuild decorations to match the new block count', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')

        // Add a third paragraph
        editor.commands.setTextSelection(editor.state.doc.content.size - 1)
        editor.commands.enter()
        editor.commands.insertContent('Third')

        const handles = editor.view.dom.querySelectorAll('.block-handle-group')

        editor.destroy()

        expect(handles.length).toBe(3)
      })
    })

    describe('WHEN a drag handle is clicked', () => {
      it('THEN should select the corresponding block via NodeSelection', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const firstGrip = grips[0] as HTMLElement

        firstGrip.click()

        const { selection } = editor.state
        const selectedNode = editor.state.doc.nodeAt(selection.from)

        editor.destroy()

        expect(selectedNode?.textContent).toBe('First')
      })
    })
  })

  describe('GIVEN a drag handle dragstart event', () => {
    describe('WHEN a handle is dragged', () => {
      it('THEN should set editor.view.dragging with selection content', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const firstGrip = grips[0] as HTMLElement

        // Use bubbles: false so the event only triggers our handler, not ProseMirror's
        // internal dragstart handler which requires browser APIs unavailable in jsdom.
        const dragEvent = new Event('dragstart', { bubbles: false }) as DragEvent

        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            effectAllowed: '',
            setDragImage: jest.fn(),
          },
        })

        firstGrip.dispatchEvent(dragEvent)

        expect(editor.view.dragging).toBeTruthy()
        expect(editor.view.dragging?.move).toBe(true)
        expect((dragEvent as DragEvent).dataTransfer?.effectAllowed).toBe('move')

        editor.destroy()
      })

      it('THEN should add the is-dragging class on dragstart and remove it on dragend', () => {
        const editor = createEditor('<p>First</p>')
        const grip = editor.view.dom.querySelector('.block-handle-grip') as HTMLElement

        const dragStartEvent = new Event('dragstart', { bubbles: false }) as DragEvent

        Object.defineProperty(dragStartEvent, 'dataTransfer', {
          value: {
            effectAllowed: '',
            setDragImage: jest.fn(),
          },
        })

        grip.dispatchEvent(dragStartEvent)

        expect(editor.view.dom.classList.contains('is-dragging')).toBe(true)

        const dragEndEvent = new Event('dragend', { bubbles: false })

        grip.dispatchEvent(dragEndEvent)

        expect(editor.view.dom.classList.contains('is-dragging')).toBe(false)

        editor.destroy()
      })

      it('THEN should handle dragstart without dataTransfer gracefully', () => {
        const editor = createEditor('<p>First</p>')
        const grip = editor.view.dom.querySelector('.block-handle-grip') as HTMLElement

        const dragEvent = new Event('dragstart', { bubbles: false })

        grip.dispatchEvent(dragEvent)

        expect(editor.view.dragging).toBeTruthy()
        expect(editor.view.dragging?.move).toBe(true)

        editor.destroy()
      })

      it('THEN should set the drag image to the block DOM element', () => {
        const editor = createEditor('<p>First</p>')
        const grip = editor.view.dom.querySelector('.block-handle-grip') as HTMLElement

        const setDragImage = jest.fn()
        const dragEvent = new Event('dragstart', { bubbles: false }) as DragEvent

        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            effectAllowed: '',
            setDragImage,
          },
        })

        grip.dispatchEvent(dragEvent)

        expect(setDragImage).toHaveBeenCalledWith(expect.any(HTMLElement), 0, 0)

        editor.destroy()
      })
    })
  })

  describe('GIVEN the decoration mapping optimization', () => {
    describe('WHEN a transaction does not change the document', () => {
      it('THEN should preserve existing decorations without rebuilding', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')

        const handlesBefore = editor.view.dom.querySelectorAll('.block-handle-group')

        expect(handlesBefore.length).toBe(2)

        // Trigger a non-doc-changing transaction (selection change)
        editor.commands.setTextSelection(1)

        const handlesAfter = editor.view.dom.querySelectorAll('.block-handle-group')

        expect(handlesAfter.length).toBe(2)

        editor.destroy()
      })
    })

    describe('WHEN a block type changes without changing block count', () => {
      it('THEN should rebuild decorations to keep handles in sync', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')

        // Transform first paragraph into a bullet list — block count stays at 2
        editor.commands.setTextSelection(1)
        editor.chain().focus().toggleBulletList().run()

        const handles = editor.view.dom.querySelectorAll('.block-handle-group')

        expect(handles.length).toBe(2)

        editor.destroy()
      })
    })

    describe('WHEN a block attribute changes without changing block count or type', () => {
      it('THEN should rebuild decorations to keep handles in sync', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')

        // Change background color on first block — count and types stay the same
        editor.commands.setTextSelection(1)
        editor.commands.setBlockBackgroundColor('#fee2e2')

        const handles = editor.view.dom.querySelectorAll('.block-handle-group')

        expect(handles.length).toBe(2)

        editor.destroy()
      })
    })

    describe('WHEN an in-block edit occurs without changing block count', () => {
      it('THEN should map decorations instead of rebuilding', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')

        // Type within first paragraph — block count stays at 2
        editor.commands.setTextSelection(1)
        editor.commands.insertContent('Hello ')

        const handles = editor.view.dom.querySelectorAll('.block-handle-group')

        expect(handles.length).toBe(2)

        editor.destroy()
      })
    })
  })

  describe('GIVEN an empty document', () => {
    describe('WHEN the editor is initialized', () => {
      it('THEN should create a handle for the empty paragraph', () => {
        const editor = createEditor('')
        const handles = editor.view.dom.querySelectorAll('.block-handle-group')

        editor.destroy()

        // Empty editor still has one paragraph node
        expect(handles.length).toBe(1)
      })
    })
  })

  describe('GIVEN the DragHandle storage', () => {
    describe('WHEN the editor is initialized', () => {
      it('THEN should have selectedBlock as null', () => {
        const editor = createEditor()
        const storage = getDragHandleStorage(editor)

        expect(storage.selectedBlock).toBeNull()

        editor.destroy()
      })

      it('THEN should have hideMenu as false', () => {
        const editor = createEditor()
        const storage = getDragHandleStorage(editor)

        expect(storage.hideMenu).toBe(false)

        editor.destroy()
      })
    })
  })

  describe('GIVEN a document with a table', () => {
    describe('WHEN a table drag handle is clicked', () => {
      it('THEN should store the table position in selectedBlock storage', () => {
        const editor = createEditor(TABLE_CONTENT)
        const storage = getDragHandleStorage(editor)
        const tablePos = findTablePos(editor)

        expect(tablePos).toBeGreaterThan(-1)

        // Click the grip button for the table (second top-level block)
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const tableGrip = grips[1] as HTMLElement

        tableGrip.click()

        expect(storage.selectedBlock).toEqual({ pos: tablePos })

        editor.destroy()
      })

      it('THEN should place cursor inside the table via TextSelection', () => {
        const editor = createEditor(TABLE_CONTENT)
        const tablePos = findTablePos(editor)

        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const tableGrip = grips[1] as HTMLElement

        tableGrip.click()

        // Selection should be inside the table, not a NodeSelection
        const { from } = editor.state.selection
        const tableNode = editor.state.doc.nodeAt(tablePos)
        const tableEnd = tablePos + (tableNode?.nodeSize ?? 0)

        expect(from).toBeGreaterThan(tablePos)
        expect(from).toBeLessThan(tableEnd)

        editor.destroy()
      })
    })

    describe('WHEN a non-table drag handle is clicked', () => {
      it('THEN should not set selectedBlock in storage', () => {
        const editor = createEditor(TABLE_CONTENT)
        const storage = getDragHandleStorage(editor)

        // Click the first grip (paragraph "Before table")
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const paragraphGrip = grips[0] as HTMLElement

        paragraphGrip.click()

        expect(storage.selectedBlock).toBeNull()

        editor.destroy()
      })
    })

    describe('WHEN a table is selected and then cursor moves outside the table', () => {
      it('THEN should clear selectedBlock on selection update', () => {
        const editor = createEditor(TABLE_CONTENT)
        const storage = getDragHandleStorage(editor)

        // Click table grip
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const tableGrip = grips[1] as HTMLElement

        tableGrip.click()

        expect(storage.selectedBlock).not.toBeNull()

        // Move cursor to the first paragraph (outside the table)
        editor.commands.setTextSelection(1)

        expect(storage.selectedBlock).toBeNull()

        editor.destroy()
      })
    })

    describe('WHEN a table is selected and cursor stays inside the table', () => {
      it('THEN should keep selectedBlock in storage', () => {
        const editor = createEditor(TABLE_CONTENT)
        const storage = getDragHandleStorage(editor)

        // Click table grip
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const tableGrip = grips[1] as HTMLElement

        tableGrip.click()

        const tablePos = storage.selectedBlock?.pos ?? -1

        expect(tablePos).toBeGreaterThan(-1)

        // Move cursor to another cell within the same table
        const tableNode = editor.state.doc.nodeAt(tablePos)
        const tableEnd = tablePos + (tableNode?.nodeSize ?? 0)

        // Set selection near the end of the table (still inside)
        editor.commands.setTextSelection(tableEnd - 3)

        expect(storage.selectedBlock).toEqual({ pos: tablePos })

        editor.destroy()
      })
    })
  })

  describe('GIVEN the resolveSelectedTable helper', () => {
    describe('WHEN no block is stored', () => {
      it('THEN should return null', () => {
        const editor = createEditor(TABLE_CONTENT)
        const result = resolveSelectedTable(editor.state, null)

        editor.destroy()

        expect(result).toBeNull()
      })
    })

    describe('WHEN the stored position does not hold a table', () => {
      it('THEN should return null', () => {
        const editor = createEditor(TABLE_CONTENT)
        const result = resolveSelectedTable(editor.state, { pos: 0 })

        editor.destroy()

        expect(result).toBeNull()
      })
    })

    describe('WHEN the caret sits outside the stored table', () => {
      it('THEN should return null', () => {
        const editor = createEditor(TABLE_CONTENT)
        const tablePos = findTablePos(editor)

        editor.commands.setTextSelection(1)

        const result = resolveSelectedTable(editor.state, { pos: tablePos })

        editor.destroy()

        expect(result).toBeNull()
      })
    })

    describe('WHEN the caret sits inside the stored table', () => {
      it('THEN should return the table position and node', () => {
        const editor = createEditor(TABLE_CONTENT)
        const tablePos = findTablePos(editor)

        // The table grip drops a valid caret in the table's first cell
        selectTableViaGrip(editor)

        const result = resolveSelectedTable(editor.state, { pos: tablePos })
        const resultPos = result?.pos
        const resultNodeName = result?.node.type.name

        editor.destroy()

        expect(resultPos).toBe(tablePos)
        expect(resultNodeName).toBe('table')
      })
    })
  })

  describe('GIVEN a table selected through its drag handle', () => {
    describe.each([['Backspace'], ['Delete']])('WHEN %s is pressed', (key) => {
      it('THEN should remove the whole table from the document', () => {
        const editor = createEditor(TABLE_CONTENT)

        selectTableViaGrip(editor)

        expect(hasTable(editor)).toBe(true)

        pressKey(editor, key)

        const stillHasTable = hasTable(editor)
        const remainingText = editor.state.doc.textContent

        editor.destroy()

        expect(stillHasTable).toBe(false)
        expect(remainingText).toContain('Before table')
        expect(remainingText).toContain('After table')
      })

      it('THEN should clear the stored block selection', () => {
        const editor = createEditor(TABLE_CONTENT)
        const storage = getDragHandleStorage(editor)

        selectTableViaGrip(editor)
        pressKey(editor, key)

        const selectedBlockAfter = storage.selectedBlock

        editor.destroy()

        expect(selectedBlockAfter).toBeNull()
      })
    })

    describe('WHEN the caret has moved out of the table before pressing Backspace', () => {
      it('THEN should keep the table in the document', () => {
        const editor = createEditor(TABLE_CONTENT)

        selectTableViaGrip(editor)

        // Move the caret to the paragraph before the table — this clears the
        // stored block selection, so Backspace must not delete the table.
        editor.commands.setTextSelection(1)

        pressKey(editor, 'Backspace')

        const stillHasTable = hasTable(editor)

        editor.destroy()

        expect(stillHasTable).toBe(true)
      })
    })
  })

  describe('GIVEN no table is selected through a drag handle', () => {
    describe('WHEN Backspace is pressed on a paragraph selected via its drag handle', () => {
      it('THEN should still delete that paragraph through the default behaviour', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        ;(grips[0] as HTMLElement).click()

        pressKey(editor, 'Backspace')

        const remainingText = editor.state.doc.textContent

        editor.destroy()

        expect(remainingText).not.toContain('First')
        expect(remainingText).toContain('Second')
      })
    })

    describe('WHEN Backspace is pressed with a caret inside a table cell', () => {
      it('THEN should keep the table in the document', () => {
        const editor = createEditor(TABLE_CONTENT)
        const storage = getDragHandleStorage(editor)

        // Caret inside the table, but the table is not block-selected
        selectTableViaGrip(editor)
        storage.selectedBlock = null

        pressKey(editor, 'Backspace')

        const stillHasTable = hasTable(editor)

        editor.destroy()

        expect(stillHasTable).toBe(true)
      })
    })
  })

  describe('GIVEN the plus button in the handle group', () => {
    describe('WHEN the document has block nodes', () => {
      it('THEN should render a plus button for each block', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const plusButtons = editor.view.dom.querySelectorAll('.block-handle-plus')

        editor.destroy()

        expect(plusButtons.length).toBe(2)
      })

      it('THEN should render the plus icon via queueMicrotask', async () => {
        const editor = createEditor('<p>Hello</p>')
        const plusButton = editor.view.dom.querySelector('.block-handle-plus')

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 0))
        })

        editor.destroy()

        expect(plusButton).not.toBeNull()
        expect(plusButton?.querySelector('svg')).not.toBeNull()
      })

      it('THEN should have the block-handle-button class', () => {
        const editor = createEditor('<p>Hello</p>')
        const plusButton = editor.view.dom.querySelector('.block-handle-plus') as HTMLElement

        editor.destroy()

        expect(plusButton.classList.contains('block-handle-button')).toBe(true)
      })

      it('THEN should not be draggable', () => {
        const editor = createEditor('<p>Hello</p>')
        const plusButton = editor.view.dom.querySelector('.block-handle-plus') as HTMLElement

        editor.destroy()

        expect(plusButton.draggable).toBe(false)
      })
    })

    describe('WHEN the plus button is clicked with slashCommands storage available', () => {
      it('THEN should call triggerMenu with a clientRect function', () => {
        const editor = createEditor('<p>Hello</p>')
        const triggerMenu = jest.fn()

        ;(editor.storage as any).slashCommands = { triggerMenu }

        const plusButton = editor.view.dom.querySelector('.block-handle-plus') as HTMLElement

        plusButton.click()

        expect(triggerMenu).toHaveBeenCalledWith(expect.any(Function))

        editor.destroy()
      })

      it('THEN should pass a function that returns the plus button bounding rect', () => {
        const editor = createEditor('<p>Hello</p>')
        const triggerMenu = jest.fn()

        ;(editor.storage as any).slashCommands = { triggerMenu }

        const plusButton = editor.view.dom.querySelector('.block-handle-plus') as HTMLElement

        plusButton.click()

        const clientRectFn = triggerMenu.mock.calls[0][0] as () => DOMRect
        const rect = clientRectFn()

        expect(rect).toEqual(
          expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
            width: expect.any(Number),
            height: expect.any(Number),
          }),
        )

        editor.destroy()
      })
    })

    describe('WHEN the plus button is clicked without slashCommands storage', () => {
      it('THEN should not throw an error', () => {
        const editor = createEditor('<p>Hello</p>')
        const plusButton = editor.view.dom.querySelector('.block-handle-plus') as HTMLElement

        expect(() => plusButton.click()).not.toThrow()

        editor.destroy()
      })
    })

    describe('WHEN the plus button is clicked with triggerMenu as null', () => {
      it('THEN should not throw an error', () => {
        const editor = createEditor('<p>Hello</p>')

        ;(editor.storage as any).slashCommands = { triggerMenu: null }

        const plusButton = editor.view.dom.querySelector('.block-handle-plus') as HTMLElement

        expect(() => plusButton.click()).not.toThrow()

        editor.destroy()
      })
    })
  })

  describe('GIVEN the selectBlock function resets hideMenu', () => {
    describe('WHEN a block is selected via grip click after hideMenu was true', () => {
      it('THEN should reset hideMenu to false', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const storage = getDragHandleStorage(editor)

        // Manually set hideMenu to true (simulating a prior ESC press)
        storage.hideMenu = true

        // Click a grip to select a block
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const firstGrip = grips[0] as HTMLElement

        firstGrip.click()

        expect(storage.hideMenu).toBe(false)

        editor.destroy()
      })
    })
  })

  describe('GIVEN the ESC key handler', () => {
    describe('WHEN ESC is pressed with no block selected', () => {
      it('THEN should not consume the event', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')

        // Place a normal text cursor
        editor.commands.setTextSelection(1)

        const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        const prevented = !editor.view.dom.dispatchEvent(event)

        editor.destroy()

        // The handler returns false so the event is not consumed
        expect(prevented).toBe(false)
      })
    })

    describe('WHEN a non-Escape key is pressed with a block selected', () => {
      it('THEN should not consume the event', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')

        // Select the first block
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        ;(grips[0] as HTMLElement).click()

        const event = new KeyboardEvent('keydown', {
          key: 'a',
          bubbles: true,
          cancelable: true,
        })

        // handleKeyDown returns false for non-Escape keys
        let result: boolean | void = undefined

        editor.view.someProp('handleKeyDown', (f) => {
          result = f(editor.view, event)
        })

        editor.destroy()

        expect(result).toBe(false)
      })
    })

    describe('WHEN ESC is pressed once with a node selected', () => {
      it('THEN should set hideMenu to true and keep the selection', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const storage = getDragHandleStorage(editor)

        // Select first block via grip
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        ;(grips[0] as HTMLElement).click()

        expect(storage.hideMenu).toBe(false)

        // Simulate ESC keydown through ProseMirror's handleKeyDown
        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        })

        editor.view.someProp('handleKeyDown', (f) => f(editor.view, escEvent))

        expect(storage.hideMenu).toBe(true)

        // Block should still be selected (NodeSelection)

        const isStillNodeSelected = editor.state.selection instanceof NodeSelection

        editor.destroy()

        expect(isStillNodeSelected).toBe(true)
      })
    })

    describe('WHEN ESC is pressed twice with a node selected', () => {
      it('THEN should deselect the block and reset hideMenu', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const storage = getDragHandleStorage(editor)

        // Select first block
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        ;(grips[0] as HTMLElement).click()

        // First ESC — hides menu
        const esc1 = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        })

        editor.view.someProp('handleKeyDown', (f) => f(editor.view, esc1))

        expect(storage.hideMenu).toBe(true)

        // Second ESC — deselects block
        const esc2 = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        })

        editor.view.someProp('handleKeyDown', (f) => f(editor.view, esc2))

        expect(storage.hideMenu).toBe(false)

        const isNodeSelected = editor.state.selection instanceof NodeSelection

        editor.destroy()

        expect(isNodeSelected).toBe(false)
      })
    })

    describe('WHEN ESC is pressed once with a table selected', () => {
      it('THEN should set hideMenu to true and keep the table selection', () => {
        const editor = createEditor(TABLE_CONTENT)
        const storage = getDragHandleStorage(editor)

        // Select table via grip
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        ;(grips[1] as HTMLElement).click()

        expect(storage.selectedBlock).not.toBeNull()
        expect(storage.hideMenu).toBe(false)

        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        })

        editor.view.someProp('handleKeyDown', (f) => f(editor.view, escEvent))

        expect(storage.hideMenu).toBe(true)
        expect(storage.selectedBlock).not.toBeNull()

        editor.destroy()
      })
    })

    describe('WHEN ESC is pressed twice with a table selected', () => {
      it('THEN should clear the table selection and reset hideMenu', () => {
        const editor = createEditor(TABLE_CONTENT)
        const storage = getDragHandleStorage(editor)

        // Select table via grip
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        ;(grips[1] as HTMLElement).click()

        // First ESC
        const esc1 = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        })

        editor.view.someProp('handleKeyDown', (f) => f(editor.view, esc1))

        expect(storage.hideMenu).toBe(true)

        // Second ESC
        const esc2 = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        })

        editor.view.someProp('handleKeyDown', (f) => f(editor.view, esc2))

        expect(storage.hideMenu).toBe(false)
        expect(storage.selectedBlock).toBeNull()

        editor.destroy()
      })
    })
  })

  describe('GIVEN the outside-click handler', () => {
    const wrapEditorInContainer = (editor: Editor) => {
      const container = document.createElement('div')

      container.className = 'rich-text-editor'
      document.body.appendChild(container)
      container.appendChild(editor.view.dom)

      return container
    }

    describe('WHEN clicking outside the editor with a node selected', () => {
      it('THEN should deselect the block', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const container = wrapEditorInContainer(editor)

        // Select first block
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        ;(grips[0] as HTMLElement).click()

        expect(editor.state.selection instanceof NodeSelection).toBe(true)

        // Simulate outside click on an element outside .rich-text-editor
        const outsideEl = document.createElement('div')

        document.body.appendChild(outsideEl)

        const mousedown = new MouseEvent('mousedown', { bubbles: true })

        outsideEl.dispatchEvent(mousedown)

        const isStillNodeSelected = editor.state.selection instanceof NodeSelection

        document.body.removeChild(outsideEl)
        document.body.removeChild(container)
        editor.destroy()

        expect(isStillNodeSelected).toBe(false)
      })
    })

    describe('WHEN clicking outside the editor with a table selected', () => {
      it('THEN should clear the table selection', () => {
        const editor = createEditor(TABLE_CONTENT)
        const container = wrapEditorInContainer(editor)
        const storage = getDragHandleStorage(editor)

        // Select table via grip
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        ;(grips[1] as HTMLElement).click()

        expect(storage.selectedBlock).not.toBeNull()

        // Simulate outside click
        const outsideEl = document.createElement('div')

        document.body.appendChild(outsideEl)

        const mousedown = new MouseEvent('mousedown', { bubbles: true })

        outsideEl.dispatchEvent(mousedown)

        const selectedBlockAfter = storage.selectedBlock

        document.body.removeChild(outsideEl)
        document.body.removeChild(container)
        editor.destroy()

        expect(selectedBlockAfter).toBeNull()
      })
    })

    describe('WHEN clicking inside the editor with a node selected', () => {
      it('THEN should not trigger outside-click deselection', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const container = wrapEditorInContainer(editor)

        // Select first block
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        ;(grips[0] as HTMLElement).click()

        expect(editor.state.selection instanceof NodeSelection).toBe(true)

        // Create a child element inside the container and click it
        // (avoid dispatching mousedown on editor.view.dom directly — ProseMirror
        //  needs elementFromPoint which jsdom doesn't support)
        const insideEl = document.createElement('span')

        container.appendChild(insideEl)

        const mousedown = new MouseEvent('mousedown', { bubbles: true })

        insideEl.dispatchEvent(mousedown)

        // The outside-click handler should see the target is inside .rich-text-editor
        // and return early — the NodeSelection should remain intact
        const isStillNodeSelected = editor.state.selection instanceof NodeSelection

        document.body.removeChild(container)
        editor.destroy()

        expect(isStillNodeSelected).toBe(true)
      })
    })

    describe('WHEN clicking editor UI marked to preserve selection (e.g. a portaled color picker)', () => {
      it('THEN should keep the block NodeSelection intact', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const container = wrapEditorInContainer(editor)

        // Select first block
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        ;(grips[0] as HTMLElement).click()

        expect(editor.state.selection instanceof NodeSelection).toBe(true)

        // The block toolbar's color picker renders in a Popper portaled to
        // document.body — OUTSIDE .rich-text-editor — but is marked so its
        // mousedown must not be treated as an outside click that deselects.
        const popper = document.createElement('div')

        popper.setAttribute('data-rte-preserve-selection', '')

        const swatch = document.createElement('button')

        popper.appendChild(swatch)
        document.body.appendChild(popper)

        const mousedown = new MouseEvent('mousedown', { bubbles: true })

        swatch.dispatchEvent(mousedown)

        const isStillNodeSelected = editor.state.selection instanceof NodeSelection

        document.body.removeChild(popper)
        document.body.removeChild(container)
        editor.destroy()

        expect(isStillNodeSelected).toBe(true)
      })
    })

    describe('WHEN clicking outside with no block selected', () => {
      it('THEN should not change the selection', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')

        wrapEditorInContainer(editor)

        // Place a normal text cursor
        editor.commands.setTextSelection(1)

        const selBefore = editor.state.selection.from

        // Simulate outside click
        const outsideEl = document.createElement('div')

        document.body.appendChild(outsideEl)

        const mousedown = new MouseEvent('mousedown', { bubbles: true })

        outsideEl.dispatchEvent(mousedown)

        const selAfter = editor.state.selection.from

        document.body.removeChild(outsideEl)
        editor.destroy()

        expect(selAfter).toBe(selBefore)
      })
    })

    describe('WHEN the editor is destroyed', () => {
      it('THEN should remove the mousedown listener', () => {
        const removeSpy = jest.spyOn(document, 'removeEventListener')
        const editor = createEditor('<p>Hello</p>')

        editor.destroy()

        expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))

        removeSpy.mockRestore()
      })
    })
  })

  describe('GIVEN the document has been edited without a structural change', () => {
    /**
     * jsdom does not propagate exceptions thrown inside DOM listeners to the
     * caller of element.click() — it dispatches a window `error` event instead.
     * Capture those so a throwing click handler fails the test rather than
     * silently leaving the previous selection in place.
     */
    const clickCapturingWindowErrors = (element: HTMLElement): ErrorEvent[] => {
      const errors: ErrorEvent[] = []
      const onError = (event: ErrorEvent): void => {
        event.preventDefault()
        errors.push(event)
      }

      window.addEventListener('error', onError)
      element.click()
      window.removeEventListener('error', onError)

      return errors
    }

    describe('WHEN text is inserted into an earlier block and a later grip is clicked', () => {
      it('THEN should select the block at its current position', () => {
        const editor = createEditor('<p>Alpha</p><p>Beta</p><p>Gamma</p>')

        editor.commands.insertContentAt(6, 'XXXXXXXXXX')

        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const errors = clickCapturingWindowErrors(grips[1] as HTMLElement)

        const { selection } = editor.state
        const isNodeSelection = selection instanceof NodeSelection
        const selectedFrom = selection.from
        const selectedText = isNodeSelection ? selection.node.textContent : null

        editor.destroy()

        expect(errors).toHaveLength(0)
        expect(isNodeSelection).toBe(true)
        expect(selectedFrom).toBe(17)
        expect(selectedText).toBe('Beta')
      })

      it('THEN should select the last block at its current position', () => {
        const editor = createEditor('<p>Alpha</p><p>Beta</p><p>Gamma</p>')

        editor.commands.insertContentAt(6, 'XXXXXXXXXX')

        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const errors = clickCapturingWindowErrors(grips[2] as HTMLElement)

        const { selection } = editor.state
        const isNodeSelection = selection instanceof NodeSelection
        const selectedFrom = selection.from
        const selectedText = isNodeSelection ? selection.node.textContent : null

        editor.destroy()

        expect(errors).toHaveLength(0)
        expect(isNodeSelection).toBe(true)
        expect(selectedFrom).toBe(23)
        expect(selectedText).toBe('Gamma')
      })

      it('THEN should point the selection at a block whose DOM node is resolvable', () => {
        const editor = createEditor('<p>Alpha</p><p>Beta</p><p>Gamma</p>')

        editor.commands.insertContentAt(6, 'XXXXXXXXXX')

        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')

        clickCapturingWindowErrors(grips[1] as HTMLElement)

        // BlockToolbar only renders the menu when nodeDOM resolves to an element.
        const blockDom = editor.view.nodeDOM(editor.state.selection.from)

        editor.destroy()

        expect(blockDom).toBeInstanceOf(HTMLElement)
      })
    })

    describe('WHEN a single character is inserted and a later grip is clicked', () => {
      it('THEN should select the block without throwing in the click listener', () => {
        const editor = createEditor('<p>Alpha</p><p>Beta</p>')

        editor.commands.insertContentAt(6, 'X')

        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const errors = clickCapturingWindowErrors(grips[1] as HTMLElement)

        const { selection } = editor.state
        const isNodeSelection = selection instanceof NodeSelection
        const selectedFrom = selection.from
        const selectedText = isNodeSelection ? selection.node.textContent : null

        editor.destroy()

        expect(errors).toHaveLength(0)
        expect(isNodeSelection).toBe(true)
        expect(selectedFrom).toBe(8)
        expect(selectedText).toBe('Beta')
      })
    })

    describe('WHEN markdown is pasted into an earlier block and a later grip is clicked', () => {
      it('THEN should select the block at its current position', () => {
        let editor!: Editor

        act(() => {
          editor = new Editor({
            extensions: [...getBaseExtensions(), DragHandle],
            content: '<p></p><p>Outro</p>',
          })
        })

        // jsdom has no ClipboardEvent — build the slice the way ProseMirror's
        // paste path does, through the Markdown extension's clipboardTextParser.
        editor.commands.setTextSelection(1)

        const slice = editor.view.someProp('clipboardTextParser', (parser) =>
          parser(
            'Hello **world** this is markdown',
            editor.state.selection.$from,
            false,
            editor.view,
          ),
        )

        if (!slice) throw new Error('clipboardTextParser did not produce a slice')

        editor.view.dispatch(editor.state.tr.replaceSelection(slice))

        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const errors = clickCapturingWindowErrors(grips[1] as HTMLElement)

        const { selection } = editor.state
        const isNodeSelection = selection instanceof NodeSelection
        const selectedFrom = selection.from
        const selectedText = isNodeSelection ? selection.node.textContent : null

        editor.destroy()

        expect(errors).toHaveLength(0)
        expect(isNodeSelection).toBe(true)
        expect(selectedFrom).toBe(30)
        expect(selectedText).toBe('Outro')
      })
    })

    describe('WHEN text is inserted before a table and the table grip is clicked', () => {
      it('THEN should store the table at its current position', () => {
        const editor = createEditor(
          '<p>Before</p><table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table><p>After</p>',
        )
        const storage = getDragHandleStorage(editor)

        editor.commands.insertContentAt(4, 'YYYY')

        const tablePos = findTablePos(editor)
        const grips = editor.view.dom.querySelectorAll('.block-handle-grip')
        const errors = clickCapturingWindowErrors(grips[1] as HTMLElement)

        const selectedBlock = storage.selectedBlock
        const resolved = resolveSelectedTable(editor.state, selectedBlock)
        const resolvedNodeName = resolved?.node.type.name

        editor.destroy()

        expect(errors).toHaveLength(0)
        expect(selectedBlock).toEqual({ pos: tablePos })
        expect(resolvedNodeName).toBe('table')
      })
    })
  })
})
