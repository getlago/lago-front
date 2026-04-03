import { Extension } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { ALL_ICONS } from 'lago-design-system'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

const dragHandlePluginKey = new PluginKey('dragHandle')

const renderGripIcon = (container: HTMLElement): void => {
  const root = createRoot(container)

  root.render(createElement(ALL_ICONS['double-dots-vertical'], { width: 16, height: 16 }))
}

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

            // Rebuild only when block structure changes (added/removed blocks).
            // For in-block edits (typing, formatting) map existing decorations.
            const oldCount = tr.before.childCount
            const newCount = tr.doc.childCount

            if (oldCount === newCount) {
              return oldSet.map(tr.mapping, tr.doc)
            }

            return buildDecorations(tr.doc)
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
