import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { act } from 'react'

import { BlockColors } from '../BlockColors'
import { DragHandle } from '../DragHandle'

const createEditor = (content = '<p>First</p><p>Second</p>') => {
  let editor!: Editor

  act(() => {
    editor = new Editor({
      extensions: [StarterKit, DragHandle, BlockColors],
      content,
    })
  })

  return editor
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

      it('THEN should render each handle with the grip SVG', () => {
        const editor = createEditor('<p>Hello</p>')
        const handle = editor.view.dom.querySelector('.block-drag-handle')

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
})
