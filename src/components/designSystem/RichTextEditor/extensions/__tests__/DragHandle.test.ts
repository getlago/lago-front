import { Editor } from '@tiptap/core'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { NodeSelection } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import { act } from 'react'

import { BlockColors } from '../BlockColors'
import { DragHandle, type DragHandleStorage } from '../DragHandle'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (editor.storage as any).dragHandle as DragHandleStorage

const pressEscape = (editor: Editor) => {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
    bubbles: true,
    cancelable: true,
  })

  editor.view.dom.dispatchEvent(event)
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
        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')

        editor.destroy()

        expect(handles.length).toBe(2)
      })

      it('THEN should render each handle with the grip SVG', async () => {
        const editor = createEditor('<p>Hello</p>')
        const handle = editor.view.dom.querySelector('.block-drag-handle')

        // renderGripIcon is deferred via queueMicrotask to avoid nested React render warnings.
        // Flush the microtask + React render with act.
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 0))
        })

        editor.destroy()

        expect(handle).not.toBeNull()
        expect(handle?.querySelector('svg')).not.toBeNull()
      })

      it('THEN should set draggable to true on each handle', () => {
        const editor = createEditor('<p>Hello</p>')
        const handle = editor.view.dom.querySelector('.block-drag-handle') as HTMLElement

        editor.destroy()

        expect(handle.draggable).toBe(true)
      })

      it('THEN should set contentEditable to false on each handle', () => {
        const editor = createEditor('<p>Hello</p>')
        const handle = editor.view.dom.querySelector('.block-drag-handle') as HTMLElement

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

        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')

        editor.destroy()

        expect(handles.length).toBe(3)
      })
    })

    describe('WHEN a drag handle is clicked', () => {
      it('THEN should select the corresponding block via NodeSelection', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
        const firstHandle = handles[0] as HTMLElement

        firstHandle.click()

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
        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
        const firstHandle = handles[0] as HTMLElement

        // Use bubbles: false so the event only triggers our handler, not ProseMirror's
        // internal dragstart handler which requires browser APIs unavailable in jsdom.
        const dragEvent = new Event('dragstart', { bubbles: false }) as DragEvent

        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            effectAllowed: '',
            setDragImage: jest.fn(),
          },
        })

        firstHandle.dispatchEvent(dragEvent)

        expect(editor.view.dragging).toBeTruthy()
        expect(editor.view.dragging?.move).toBe(true)
        expect((dragEvent as DragEvent).dataTransfer?.effectAllowed).toBe('move')

        editor.destroy()
      })

      it('THEN should set the drag image to the block DOM element', () => {
        const editor = createEditor('<p>First</p>')
        const handle = editor.view.dom.querySelector('.block-drag-handle') as HTMLElement

        const setDragImage = jest.fn()
        const dragEvent = new Event('dragstart', { bubbles: false }) as DragEvent

        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            effectAllowed: '',
            setDragImage,
          },
        })

        handle.dispatchEvent(dragEvent)

        expect(setDragImage).toHaveBeenCalledWith(expect.any(HTMLElement), 0, 0)

        editor.destroy()
      })
    })
  })

  describe('GIVEN the decoration mapping optimization', () => {
    describe('WHEN a transaction does not change the document', () => {
      it('THEN should preserve existing decorations without rebuilding', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')

        const handlesBefore = editor.view.dom.querySelectorAll('.block-drag-handle')

        expect(handlesBefore.length).toBe(2)

        // Trigger a non-doc-changing transaction (selection change)
        editor.commands.setTextSelection(1)

        const handlesAfter = editor.view.dom.querySelectorAll('.block-drag-handle')

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

        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')

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

        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')

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

        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')

        expect(handles.length).toBe(2)

        editor.destroy()
      })
    })
  })

  describe('GIVEN an empty document', () => {
    describe('WHEN the editor is initialized', () => {
      it('THEN should create a handle for the empty paragraph', () => {
        const editor = createEditor('')
        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')

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

      it('THEN should have toolbarDismissed as false', () => {
        const editor = createEditor()
        const storage = getDragHandleStorage(editor)

        expect(storage.toolbarDismissed).toBe(false)

        editor.destroy()
      })
    })
  })

  describe('GIVEN a document with a table', () => {
    describe('WHEN a table drag handle is clicked', () => {
      it('THEN should store the table position in selectedBlock storage', () => {
        const editor = createEditor(TABLE_CONTENT)
        const storage = getDragHandleStorage(editor)

        // Find the table node position
        let tablePos = -1

        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'table' && tablePos === -1) {
            tablePos = pos
          }
        })

        expect(tablePos).toBeGreaterThan(-1)

        // Click the drag handle for the table (second top-level block)
        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
        const tableHandle = handles[1] as HTMLElement

        tableHandle.click()

        expect(storage.selectedBlock).toEqual({ pos: tablePos })

        editor.destroy()
      })

      it('THEN should place cursor inside the table via TextSelection', () => {
        const editor = createEditor(TABLE_CONTENT)

        let tablePos = -1

        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'table' && tablePos === -1) {
            tablePos = pos
          }
        })

        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
        const tableHandle = handles[1] as HTMLElement

        tableHandle.click()

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

        // Click the first handle (paragraph "Before table")
        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
        const paragraphHandle = handles[0] as HTMLElement

        paragraphHandle.click()

        expect(storage.selectedBlock).toBeNull()

        editor.destroy()
      })
    })

    describe('WHEN a table is selected and then cursor moves outside the table', () => {
      it('THEN should clear selectedBlock on selection update', () => {
        const editor = createEditor(TABLE_CONTENT)
        const storage = getDragHandleStorage(editor)

        // Click table handle
        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
        const tableHandle = handles[1] as HTMLElement

        tableHandle.click()

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

        // Click table handle
        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
        const tableHandle = handles[1] as HTMLElement

        tableHandle.click()

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

  describe('GIVEN the Escape key behavior', () => {
    describe('GIVEN a paragraph block is selected via drag handle', () => {
      describe('WHEN Escape is pressed once', () => {
        it('THEN should dismiss the toolbar but keep the block selected', () => {
          const editor = createEditor('<p>First</p><p>Second</p>')
          const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
          const firstHandle = handles[0] as HTMLElement

          firstHandle.click()
          const storage = getDragHandleStorage(editor)

          expect(editor.state.selection instanceof NodeSelection).toBe(true)
          expect(storage.toolbarDismissed).toBe(false)

          pressEscape(editor)

          expect(storage.toolbarDismissed).toBe(true)
          expect(editor.state.selection instanceof NodeSelection).toBe(true)

          editor.destroy()
        })
      })

      describe('WHEN Escape is pressed twice', () => {
        it('THEN should deselect the block and convert to text selection', () => {
          const editor = createEditor('<p>First</p><p>Second</p>')
          const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
          const firstHandle = handles[0] as HTMLElement

          firstHandle.click()
          const storage = getDragHandleStorage(editor)

          pressEscape(editor)
          pressEscape(editor)

          expect(storage.toolbarDismissed).toBe(false)
          expect(editor.state.selection instanceof NodeSelection).toBe(false)

          editor.destroy()
        })
      })
    })

    describe('GIVEN a table is selected via drag handle', () => {
      describe('WHEN Escape is pressed twice', () => {
        it('THEN should clear the selectedBlock storage', () => {
          const editor = createEditor(TABLE_CONTENT)
          const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
          const tableHandle = handles[1] as HTMLElement

          tableHandle.click()
          const storage = getDragHandleStorage(editor)

          expect(storage.selectedBlock).not.toBeNull()

          pressEscape(editor)
          expect(storage.toolbarDismissed).toBe(true)

          pressEscape(editor)
          expect(storage.selectedBlock).toBeNull()
          expect(storage.toolbarDismissed).toBe(false)

          editor.destroy()
        })
      })
    })

    describe('GIVEN no block is selected', () => {
      describe('WHEN Escape is pressed', () => {
        it('THEN should not affect the selection', () => {
          const editor = createEditor('<p>First</p><p>Second</p>')

          editor.commands.setTextSelection(1)
          const selBefore = editor.state.selection.from

          pressEscape(editor)

          expect(editor.state.selection.from).toBe(selBefore)
          expect(editor.state.selection instanceof NodeSelection).toBe(false)

          editor.destroy()
        })
      })
    })
  })

  describe('GIVEN the toolbarDismissed state', () => {
    describe('WHEN a new block is selected via drag handle', () => {
      it('THEN should reset toolbarDismissed to false', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
        const firstHandle = handles[0] as HTMLElement
        const secondHandle = handles[1] as HTMLElement

        firstHandle.click()
        const storage = getDragHandleStorage(editor)

        pressEscape(editor)
        expect(storage.toolbarDismissed).toBe(true)

        secondHandle.click()
        expect(storage.toolbarDismissed).toBe(false)

        editor.destroy()
      })
    })

    describe('WHEN the cursor moves to a text position', () => {
      it('THEN should reset toolbarDismissed via onSelectionUpdate', () => {
        const editor = createEditor('<p>First</p><p>Second</p>')
        const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
        const firstHandle = handles[0] as HTMLElement

        firstHandle.click()
        const storage = getDragHandleStorage(editor)

        pressEscape(editor)
        expect(storage.toolbarDismissed).toBe(true)

        editor.commands.setTextSelection(1)

        expect(storage.toolbarDismissed).toBe(false)

        editor.destroy()
      })
    })
  })

  describe('GIVEN the outside click behavior', () => {
    describe('GIVEN a paragraph block is selected', () => {
      describe('WHEN clicking outside the editor', () => {
        it('THEN should deselect the block and reset storage', () => {
          const editor = createEditor('<p>First</p><p>Second</p>')
          const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
          const firstHandle = handles[0] as HTMLElement

          firstHandle.click()
          const storage = getDragHandleStorage(editor)

          expect(editor.state.selection instanceof NodeSelection).toBe(true)

          const outsideEl = document.createElement('div')

          document.body.appendChild(outsideEl)
          outsideEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
          document.body.removeChild(outsideEl)

          expect(storage.selectedBlock).toBeNull()
          expect(storage.toolbarDismissed).toBe(false)
          expect(editor.state.selection instanceof NodeSelection).toBe(false)

          editor.destroy()
        })
      })
    })

    describe('GIVEN a table is selected via drag handle', () => {
      describe('WHEN clicking outside the editor', () => {
        it('THEN should clear selectedBlock storage', () => {
          const editor = createEditor(TABLE_CONTENT)
          const handles = editor.view.dom.querySelectorAll('.block-drag-handle')
          const tableHandle = handles[1] as HTMLElement

          tableHandle.click()
          const storage = getDragHandleStorage(editor)

          expect(storage.selectedBlock).not.toBeNull()

          const outsideEl = document.createElement('div')

          document.body.appendChild(outsideEl)
          outsideEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
          document.body.removeChild(outsideEl)

          expect(storage.selectedBlock).toBeNull()
          expect(storage.toolbarDismissed).toBe(false)

          editor.destroy()
        })
      })
    })
  })
})
