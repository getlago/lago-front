import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * Clears stored inline marks (bold, italic, underline, color, etc.) whenever
 * a new empty block is created — typically by pressing Enter.
 *
 * ProseMirror carries "stored marks" from the split point into the new block
 * so that subsequent typing inherits the formatting.  This extension detects
 * that scenario and resets stored marks to an empty set, giving the user a
 * clean slate on each new block.
 */
export const ResetMarksOnNewBlock = Extension.create({
  name: 'resetMarksOnNewBlock',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('resetMarksOnNewBlock'),

        appendTransaction(transactions, oldState, newState) {
          // Only act when the document actually changed.
          if (!transactions.some((tr) => tr.docChanged)) return null

          // A block split grows the document — skip deletions / pure replacements.
          if (newState.doc.content.size <= oldState.doc.content.size) return null

          const { $from } = newState.selection

          // Selection must be at the very start of an empty block node.
          if ($from.parent.content.size !== 0 || $from.parentOffset !== 0) return null

          // If there are stored marks, clear them.
          if (newState.storedMarks && newState.storedMarks.length > 0) {
            return newState.tr.setStoredMarks([])
          }

          return null
        },
      }),
    ]
  },
})
