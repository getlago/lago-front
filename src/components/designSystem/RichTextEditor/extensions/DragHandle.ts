import { Extension } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const dragHandlePluginKey = new PluginKey('dragHandle')

const GRIP_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
  <circle cx="5" cy="3" r="1.2" fill="currentColor"/>
  <circle cx="9" cy="3" r="1.2" fill="currentColor"/>
  <circle cx="5" cy="7" r="1.2" fill="currentColor"/>
  <circle cx="9" cy="7" r="1.2" fill="currentColor"/>
  <circle cx="5" cy="11" r="1.2" fill="currentColor"/>
  <circle cx="9" cy="11" r="1.2" fill="currentColor"/>
</svg>`

export const DragHandle = Extension.create({
  name: 'dragHandle',

  addProseMirrorPlugins() {
    const editor = this.editor

    function selectBlock(pos: number) {
      const tr = editor.view.state.tr.setSelection(NodeSelection.create(editor.view.state.doc, pos))

      editor.view.dispatch(tr)
      editor.view.focus()
    }

    function createHandleElement(pos: number): HTMLElement {
      const handle = document.createElement('div')

      handle.className = 'block-drag-handle'
      handle.draggable = true
      handle.contentEditable = 'false'
      handle.innerHTML = GRIP_SVG

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
            if (tr.docChanged) {
              return buildDecorations(tr.doc)
            }

            return oldSet
          },
        },
        props: {
          decorations(state) {
            return dragHandlePluginKey.getState(state)
          },
        },
      }),
    ]
  },
})
