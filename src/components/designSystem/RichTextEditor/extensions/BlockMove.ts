import { Extension } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'

import { resolveTopLevelBlock } from './BlockUtils'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockMove: {
      moveBlockUp: () => ReturnType
      moveBlockDown: () => ReturnType
    }
  }
}

export const BlockMove = Extension.create({
  name: 'blockMove',

  addCommands() {
    return {
      moveBlockUp:
        () =>
        ({ state, dispatch }) => {
          const block = resolveTopLevelBlock(state)

          if (!block) return false

          const { pos, node } = block
          const $pos = state.doc.resolve(pos)
          const index = $pos.index(0)

          if (index === 0) return false

          const prevNode = state.doc.child(index - 1)
          const prevPos = pos - prevNode.nodeSize

          if (dispatch) {
            const tr = state.tr.replaceWith(prevPos, pos + node.nodeSize, [
              node.copy(node.content),
              prevNode.copy(prevNode.content),
            ])

            tr.setSelection(NodeSelection.create(tr.doc, prevPos))
            dispatch(tr)
          }

          return true
        },

      moveBlockDown:
        () =>
        ({ state, dispatch }) => {
          const block = resolveTopLevelBlock(state)

          if (!block) return false

          const { pos, node } = block
          const $pos = state.doc.resolve(pos)
          const index = $pos.index(0)

          if (index >= state.doc.childCount - 1) return false

          const nextNode = state.doc.child(index + 1)
          const nextPos = pos + node.nodeSize

          if (dispatch) {
            const tr = state.tr.replaceWith(pos, nextPos + nextNode.nodeSize, [
              nextNode.copy(nextNode.content),
              node.copy(node.content),
            ])

            tr.setSelection(NodeSelection.create(tr.doc, pos + nextNode.nodeSize))
            dispatch(tr)
          }

          return true
        },
    }
  },
})
