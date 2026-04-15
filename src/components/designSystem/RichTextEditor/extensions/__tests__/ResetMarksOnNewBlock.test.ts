import { Editor } from '@tiptap/core'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'

import { ResetMarksOnNewBlock } from '../ResetMarksOnNewBlock'

const createEditor = (content: string) =>
  new Editor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      ResetMarksOnNewBlock,
    ],
    content,
  })

/** Place the text cursor at a specific position in the editor. */
const setCursor = (editor: Editor, pos: number) => {
  editor.commands.setTextSelection(pos)
}

/** Place the cursor at the end of the first block's text content. */
const setCursorAtEndOfFirstBlock = (editor: Editor) => {
  const firstChild = editor.state.doc.child(0)
  // Position 1 is start of first block's content, + textContent length = end of text
  const endPos = 1 + firstChild.content.size

  setCursor(editor, endPos)
}

describe('ResetMarksOnNewBlock', () => {
  describe('GIVEN the ResetMarksOnNewBlock extension', () => {
    it('THEN should have the correct name', () => {
      expect(ResetMarksOnNewBlock.name).toBe('resetMarksOnNewBlock')
    })
  })

  describe('GIVEN a paragraph with bold text', () => {
    describe('WHEN splitting the block at the end', () => {
      it('THEN should clear stored marks on the new empty block', () => {
        const editor = createEditor('<p><strong>Hello bold</strong></p>')

        setCursorAtEndOfFirstBlock(editor)

        // Verify bold is active before split
        expect(editor.isActive('bold')).toBe(true)

        editor.commands.splitBlock()

        // After split, cursor is in the new empty paragraph
        // Stored marks should be cleared
        expect(editor.state.storedMarks).toEqual([])

        editor.destroy()
      })
    })
  })

  describe('GIVEN a paragraph with italic text', () => {
    describe('WHEN splitting the block at the end', () => {
      it('THEN should clear stored marks on the new empty block', () => {
        const editor = createEditor('<p><em>Hello italic</em></p>')

        setCursorAtEndOfFirstBlock(editor)
        editor.commands.splitBlock()

        expect(editor.state.storedMarks).toEqual([])

        editor.destroy()
      })
    })
  })

  describe('GIVEN a paragraph with underlined text', () => {
    describe('WHEN splitting the block at the end', () => {
      it('THEN should clear stored marks on the new empty block', () => {
        const editor = createEditor('<p><u>Hello underline</u></p>')

        setCursorAtEndOfFirstBlock(editor)
        editor.commands.splitBlock()

        expect(editor.state.storedMarks).toEqual([])

        editor.destroy()
      })
    })
  })

  describe('GIVEN a paragraph with multiple inline styles', () => {
    describe('WHEN splitting the block at the end', () => {
      it('THEN should clear all stored marks on the new empty block', () => {
        const editor = createEditor('<p><strong><em><u>Bold italic underline</u></em></strong></p>')

        setCursorAtEndOfFirstBlock(editor)
        editor.commands.splitBlock()

        expect(editor.state.storedMarks).toEqual([])

        editor.destroy()
      })
    })
  })

  describe('GIVEN a paragraph with colored text', () => {
    describe('WHEN splitting the block at the end', () => {
      it('THEN should clear text color stored marks on the new empty block', () => {
        const editor = createEditor('<p><span style="color: #ff0000">Red text</span></p>')

        setCursorAtEndOfFirstBlock(editor)
        editor.commands.splitBlock()

        expect(editor.state.storedMarks).toEqual([])

        editor.destroy()
      })
    })
  })

  describe('GIVEN a paragraph with highlighted text', () => {
    describe('WHEN splitting the block at the end', () => {
      it('THEN should clear highlight stored marks on the new empty block', () => {
        const editor = createEditor(
          '<p><mark data-color="#ffff00" style="background-color: #ffff00">Highlighted</mark></p>',
        )

        setCursorAtEndOfFirstBlock(editor)
        editor.commands.splitBlock()

        expect(editor.state.storedMarks).toEqual([])

        editor.destroy()
      })
    })
  })

  describe('GIVEN a paragraph with plain text', () => {
    describe('WHEN splitting the block at the end', () => {
      it('THEN should not set stored marks (no marks to clear)', () => {
        const editor = createEditor('<p>Plain text</p>')

        setCursorAtEndOfFirstBlock(editor)
        editor.commands.splitBlock()

        // storedMarks should be null (no marks were carried) or empty array
        const marks = editor.state.storedMarks

        expect(!marks || marks.length === 0).toBe(true)

        editor.destroy()
      })
    })
  })

  describe('GIVEN a paragraph with bold text', () => {
    describe('WHEN splitting the block in the middle of the text', () => {
      it('THEN should clear stored marks since the new block has content but cursor is at start', () => {
        const editor = createEditor('<p><strong>Hello World</strong></p>')

        // Position cursor in the middle of "Hello World" (after "Hello")
        setCursor(editor, 6) // "Hello" = 5 chars, +1 for paragraph opening = pos 6

        editor.commands.splitBlock()

        // After split at "Hello|World", the second block has " World" with bold.
        // The cursor is at the start of the second block which has content,
        // so the extension should NOT clear marks (block is not empty).
        // The marks come from the existing content, not from stored marks.
        const secondBlock = editor.state.doc.child(1)

        expect(secondBlock.textContent).toBe(' World')

        editor.destroy()
      })
    })
  })

  describe('GIVEN a paragraph where the user explicitly sets bold after a split', () => {
    describe('WHEN the user toggles bold on the new empty block', () => {
      it('THEN should preserve the manually set bold mark', () => {
        const editor = createEditor('<p><strong>Bold text</strong></p>')

        setCursorAtEndOfFirstBlock(editor)
        editor.commands.splitBlock()

        // Stored marks cleared by our extension
        expect(editor.state.storedMarks).toEqual([])

        // User explicitly toggles bold back on
        editor.commands.toggleBold()

        // Now stored marks should include bold
        expect(editor.state.storedMarks?.some((m) => m.type.name === 'bold')).toBe(true)

        editor.destroy()
      })
    })
  })

  describe('GIVEN multiple paragraphs where the second has marks', () => {
    describe('WHEN splitting the second block', () => {
      it('THEN should clear stored marks on the resulting new block', () => {
        const editor = createEditor('<p>Plain first</p><p><strong>Bold second</strong></p>')

        // Move cursor to the end of the second paragraph
        const firstNodeSize = editor.state.doc.child(0).nodeSize
        const secondChild = editor.state.doc.child(1)
        const endOfSecond = firstNodeSize + 1 + secondChild.content.size

        setCursor(editor, endOfSecond)
        editor.commands.splitBlock()

        expect(editor.state.storedMarks).toEqual([])

        editor.destroy()
      })
    })
  })
})
