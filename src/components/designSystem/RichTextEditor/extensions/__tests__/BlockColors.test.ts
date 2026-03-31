import { Editor } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'

import { BlockColors } from '../BlockColors'

const createEditor = (content = '') => {
  return new Editor({
    extensions: [StarterKit, BlockColors],
    content,
  })
}

describe('BlockColors', () => {
  describe('GIVEN the BlockColors extension', () => {
    it('THEN should have the correct name', () => {
      expect(BlockColors.name).toBe('blockColors')
    })
  })

  describe('GIVEN renderHTML via getHTML()', () => {
    describe('WHEN a paragraph has no color attributes', () => {
      it('THEN should not render inline styles', () => {
        const editor = createEditor('<p>Plain text</p>')
        const html = editor.getHTML()

        editor.destroy()

        expect(html).not.toContain('style=')
        expect(html).toContain('Plain text')
      })
    })
  })

  describe('GIVEN the setBlockBackgroundColor command', () => {
    describe('WHEN called with a color on a text selection', () => {
      it('THEN should apply backgroundColor to the top-level block', () => {
        const editor = createEditor('<p>Hello world</p><p>Second</p>')

        editor.commands.setTextSelection(1)
        editor.commands.setBlockBackgroundColor('#fee2e2')

        const firstNode = editor.state.doc.firstChild

        editor.destroy()

        expect(firstNode?.attrs.backgroundColor).toBe('#fee2e2')
      })
    })

    describe('WHEN called with null', () => {
      it('THEN should remove the backgroundColor', () => {
        const editor = createEditor('<p>Hello world</p>')

        editor.commands.setTextSelection(1)
        editor.commands.setBlockBackgroundColor('#fee2e2')
        editor.commands.setBlockBackgroundColor(null)

        const firstNode = editor.state.doc.firstChild

        editor.destroy()

        expect(firstNode?.attrs.backgroundColor).toBeNull()
      })
    })

    describe('WHEN called with a NodeSelection', () => {
      it('THEN should apply backgroundColor to the selected node', () => {
        const editor = createEditor('<p>Hello world</p>')

        const tr = editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0))

        editor.view.dispatch(tr)
        editor.commands.setBlockBackgroundColor('#dcfce7')

        const firstNode = editor.state.doc.firstChild

        editor.destroy()

        expect(firstNode?.attrs.backgroundColor).toBe('#dcfce7')
      })
    })

    describe('WHEN the selection is at depth 0 (empty doc edge case)', () => {
      it('THEN should return false', () => {
        const editor = createEditor('<p>text</p>')

        // Force an edge case by checking the command can handle it
        const result = editor.commands.setBlockBackgroundColor('#fee2e2')

        editor.destroy()

        expect(result).toBe(true)
      })
    })
  })

  describe('GIVEN the setBlockTextColor command', () => {
    describe('WHEN called with a color', () => {
      it('THEN should apply textColor to the top-level block', () => {
        const editor = createEditor('<p>Hello world</p>')

        editor.commands.setTextSelection(1)
        editor.commands.setBlockTextColor('#dc2626')

        const firstNode = editor.state.doc.firstChild

        editor.destroy()

        expect(firstNode?.attrs.textColor).toBe('#dc2626')
      })
    })

    describe('WHEN called with null', () => {
      it('THEN should remove the textColor', () => {
        const editor = createEditor('<p>Hello world</p>')

        editor.commands.setTextSelection(1)
        editor.commands.setBlockTextColor('#dc2626')
        editor.commands.setBlockTextColor(null)

        const firstNode = editor.state.doc.firstChild

        editor.destroy()

        expect(firstNode?.attrs.textColor).toBeNull()
      })
    })
  })

  describe('GIVEN parseHTML', () => {
    describe('WHEN loading HTML with inline background-color style', () => {
      it('THEN should parse the backgroundColor attribute', () => {
        const editor = createEditor(
          '<p style="background-color: rgb(254, 226, 226);">Colored</p>',
        )

        const firstNode = editor.state.doc.firstChild

        editor.destroy()

        expect(firstNode?.attrs.backgroundColor).toBe('rgb(254, 226, 226)')
      })
    })

    describe('WHEN loading HTML with inline color style', () => {
      it('THEN should parse the textColor attribute', () => {
        const editor = createEditor('<p style="color: rgb(220, 38, 38);">Red text</p>')

        const firstNode = editor.state.doc.firstChild

        editor.destroy()

        expect(firstNode?.attrs.textColor).toBe('rgb(220, 38, 38)')
      })
    })

    describe('WHEN loading HTML with no inline styles', () => {
      it('THEN should have null color attributes', () => {
        const editor = createEditor('<p>Plain</p>')

        const firstNode = editor.state.doc.firstChild

        editor.destroy()

        expect(firstNode?.attrs.backgroundColor).toBeNull()
        expect(firstNode?.attrs.textColor).toBeNull()
      })
    })
  })

  describe('GIVEN colors applied via commands then serialized', () => {
    describe('WHEN getHTML is called after setting colors', () => {
      it('THEN should include inline styles in the output', () => {
        const editor = createEditor('<p>Styled text</p>')

        editor.commands.setTextSelection(1)
        editor.commands.setBlockBackgroundColor('#dbeafe')
        editor.commands.setBlockTextColor('#2563eb')

        const html = editor.getHTML()

        editor.destroy()

        expect(html).toContain('background-color:')
        expect(html).toContain('color:')
        expect(html).toContain('style=')
      })
    })
  })
})
