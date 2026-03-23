import { act, cleanup, screen } from '@testing-library/react'

import { render } from '~/test-utils'

import RichTextEditor, { RICH_TEXT_EDITOR_TEST_ID } from '../RichTextEditor'

const mockEditor = {
  isActive: jest.fn().mockReturnValue(false),
  can: jest.fn().mockReturnValue({
    undo: jest.fn().mockReturnValue(false),
    redo: jest.fn().mockReturnValue(false),
  }),
  chain: jest.fn().mockReturnValue({
    focus: jest.fn().mockReturnValue({
      toggleBold: jest.fn().mockReturnValue({ run: jest.fn() }),
      toggleItalic: jest.fn().mockReturnValue({ run: jest.fn() }),
      toggleUnderline: jest.fn().mockReturnValue({ run: jest.fn() }),
      toggleStrike: jest.fn().mockReturnValue({ run: jest.fn() }),
      toggleCode: jest.fn().mockReturnValue({ run: jest.fn() }),
      toggleHighlight: jest.fn().mockReturnValue({ run: jest.fn() }),
      toggleSuperscript: jest.fn().mockReturnValue({ run: jest.fn() }),
      toggleSubscript: jest.fn().mockReturnValue({ run: jest.fn() }),
      toggleBulletList: jest.fn().mockReturnValue({ run: jest.fn() }),
      toggleOrderedList: jest.fn().mockReturnValue({ run: jest.fn() }),
      toggleCodeBlock: jest.fn().mockReturnValue({ run: jest.fn() }),
      setHeading: jest.fn().mockReturnValue({ run: jest.fn() }),
      setParagraph: jest.fn().mockReturnValue({ run: jest.fn() }),
      setTextAlign: jest.fn().mockReturnValue({ run: jest.fn() }),
      setLink: jest.fn().mockReturnValue({ run: jest.fn() }),
      unsetLink: jest.fn().mockReturnValue({ run: jest.fn() }),
      insertTable: jest.fn().mockReturnValue({ run: jest.fn() }),
      undo: jest.fn().mockReturnValue({ run: jest.fn() }),
      redo: jest.fn().mockReturnValue({ run: jest.fn() }),
    }),
  }),
}

jest.mock('@tiptap/react', () => ({
  ...jest.requireActual('@tiptap/react'),
  useEditor: jest.fn().mockImplementation(() => mockEditor),
  useEditorState: jest.fn().mockImplementation(({ selector }) => {
    if (selector) {
      return selector({ editor: mockEditor })
    }

    return {}
  }),
  EditorContent: ({ editor }: { editor: unknown }) =>
    editor ? <div data-test="editor-content">Editor content</div> : null,
}))

describe('RichTextEditor', () => {
  afterEach(cleanup)

  describe('GIVEN the editor is initialized', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the editor container', async () => {
        await act(() => render(<RichTextEditor />))

        expect(screen.getByTestId(RICH_TEXT_EDITOR_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the editor content', async () => {
        await act(() => render(<RichTextEditor />))

        expect(screen.getByTestId('editor-content')).toBeInTheDocument()
      })

      it('THEN should render the toolbar', async () => {
        await act(() => render(<RichTextEditor />))

        expect(screen.getByTestId('toolbar-container')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the editor fails to initialize', () => {
    describe('WHEN useEditor returns null', () => {
      it('THEN should render nothing', async () => {
        const tiptap = jest.requireMock('@tiptap/react')

        tiptap.useEditor.mockReturnValue(null)

        const { container } = await act(() => render(<RichTextEditor />))

        expect(container.innerHTML).toBe('')

        tiptap.useEditor.mockReturnValue(mockEditor)
      })
    })
  })
})
