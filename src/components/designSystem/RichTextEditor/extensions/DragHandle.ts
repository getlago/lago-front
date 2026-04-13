import { type Editor, Extension } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { ALL_ICONS } from 'lago-design-system'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

const dragHandlePluginKey = new PluginKey('dragHandle')

const renderGripIcon = (container: HTMLElement): void => {
  // Defer to avoid "triggering nested component updates from render" warning.
  // ProseMirror creates decoration widgets synchronously during React's render cycle.
  queueMicrotask(() => {
    const root = createRoot(container)

    root.render(createElement(ALL_ICONS['double-dots-vertical'], { width: 16, height: 16 }))
  })
}

export type DragHandleStorage = {
  selectedBlock: { pos: number } | null
}

const isDragHandleStorage = (value: unknown): value is DragHandleStorage =>
  value !== null && typeof value === 'object' && 'selectedBlock' in value

export const getDragHandleStorage = (editor: Editor): DragHandleStorage => {
  if ('dragHandle' in editor.storage && isDragHandleStorage(editor.storage.dragHandle)) {
    return editor.storage.dragHandle
  }

  return { selectedBlock: null }
}

export const DragHandle = Extension.create({
  name: 'dragHandle',

  addStorage() {
    return {
      /** When a table's drag handle is clicked, the table plugin converts NodeSelection
       *  to CellSelection, so BlockToolbar can't detect it. We store the selected block
       *  info here so BlockToolbar can fall back to it. */
      selectedBlock: null as { pos: number } | null,
    }
  },

  onSelectionUpdate() {
    const storage = getDragHandleStorage(this.editor)

    // Clear table block selection when the user moves the cursor elsewhere
    if (storage.selectedBlock) {
      const { pos } = storage.selectedBlock
      const node = this.editor.state.doc.nodeAt(pos)

      if (node?.type.name !== 'table') {
        storage.selectedBlock = null

        return
      }

      // Check if the selection is still inside this table
      const selFrom = this.editor.state.selection.from
      const tableEnd = pos + node.nodeSize

      if (selFrom < pos || selFrom > tableEnd) {
        storage.selectedBlock = null
      }
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const storage = getDragHandleStorage(editor)

    function selectBlock(pos: number) {
      const node = editor.view.state.doc.nodeAt(pos)

      // For tables, avoid NodeSelection entirely — prosemirror-tables converts it
      // to CellSelection which causes a flash of selected cells. Instead, place a
      // TextSelection inside the first cell and use storage + ProseMirror-selectednode
      // class for the block-selected appearance.
      if (node?.type.name === 'table') {
        storage.selectedBlock = { pos }

        // Place cursor inside the first cell so the table remains "active"
        const $insideTable = editor.view.state.doc.resolve(pos + 1)
        const textPos = TextSelection.near($insideTable)
        const tr = editor.view.state.tr.setSelection(textPos)

        editor.view.dispatch(tr)
        editor.view.focus()

        return
      }

      storage.selectedBlock = null

      const tr = editor.view.state.tr.setSelection(NodeSelection.create(editor.view.state.doc, pos))

      editor.view.dispatch(tr)
      editor.view.focus()
    }

    function createHandleElement(pos: number): HTMLElement {
      const handle = document.createElement('div')

      handle.className = 'block-drag-handle'
      handle.draggable = true
      handle.contentEditable = 'false'
      const iconContainer = document.createElement('span')

      handle.appendChild(iconContainer)
      renderGripIcon(iconContainer)

      handle.addEventListener('dragstart', (e) => {
        selectBlock(pos)

        editor.view.dragging = {
          slice: editor.view.state.selection.content(),
          move: true,
        }

        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move'
        }

        const blockDom = editor.view.nodeDOM(pos)

        if (blockDom instanceof HTMLElement && e.dataTransfer) {
          e.dataTransfer.setDragImage(blockDom, 0, 0)
        }

        editor.view.dom.classList.add('is-dragging')
      })

      handle.addEventListener('dragend', () => {
        editor.view.dom.classList.remove('is-dragging')
      })

      handle.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        selectBlock(pos)
      })

      return handle
    }

    function buildDecorations(doc: PmNode): DecorationSet {
      const decorations: Decoration[] = []

      doc.forEach((node, pos) => {
        decorations.push(
          Decoration.widget(pos, () => createHandleElement(pos), {
            side: -1,
            key: `drag-handle-${pos}`,
            ignoreSelection: true,
          }),
        )
      })

      return DecorationSet.create(doc, decorations)
    }

    return [
      new Plugin({
        key: dragHandlePluginKey,
        state: {
          init(_, state) {
            return buildDecorations(state.doc)
          },
          apply(tr, oldSet) {
            if (!tr.docChanged) return oldSet

            // Rebuild when block structure changes: different count or different
            // node types (e.g. paragraph → bulletList). For in-block edits
            // (typing, formatting) map existing decorations.
            const oldDoc = tr.before
            const newDoc = tr.doc

            if (oldDoc.childCount === newDoc.childCount) {
              let structureChanged = false

              for (let i = 0; i < newDoc.childCount; i++) {
                const oldChild = oldDoc.child(i)
                const newChild = newDoc.child(i)

                if (
                  oldChild.type.name !== newChild.type.name ||
                  oldChild.attrs !== newChild.attrs
                ) {
                  structureChanged = true
                  break
                }
              }

              if (!structureChanged) {
                return oldSet.map(tr.mapping, tr.doc)
              }
            }

            return buildDecorations(newDoc)
          },
        },
        props: {
          decorations(state) {
            const handleDecos = dragHandlePluginKey.getState(state) as DecorationSet

            // Add table block-selected decoration from storage, but only while
            // the selection is still inside the table.
            if (storage.selectedBlock) {
              const { pos } = storage.selectedBlock
              const node = state.doc.nodeAt(pos)

              if (node?.type.name === 'table') {
                const selFrom = state.selection.from
                const tableEnd = pos + node.nodeSize

                if (selFrom >= pos && selFrom <= tableEnd) {
                  const tableDeco = Decoration.node(pos, pos + node.nodeSize, {
                    class: 'is-block-selected',
                  })

                  return handleDecos.add(state.doc, [tableDeco])
                }
              }
            }

            return handleDecos
          },
          handleClick() {
            // User clicked inside the editor content (not on a drag handle).
            // Clear the table-selected-via-drag-handle flag.
            storage.selectedBlock = null

            return false // don't consume the event
          },
        },
      }),
    ]
  },
})
