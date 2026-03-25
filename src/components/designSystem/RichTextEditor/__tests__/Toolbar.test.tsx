import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/core'

import { render } from '~/test-utils'

import Toolbar, {
  TOOLBAR_ALIGN_DROPDOWN_TEST_ID,
  TOOLBAR_BOLD_BUTTON_TEST_ID,
  TOOLBAR_CODE_BLOCK_BUTTON_TEST_ID,
  TOOLBAR_CODE_BUTTON_TEST_ID,
  TOOLBAR_CONTAINER_TEST_ID,
  TOOLBAR_HIGHLIGHT_BUTTON_TEST_ID,
  TOOLBAR_IMAGE_BUTTON_TEST_ID,
  TOOLBAR_ITALIC_BUTTON_TEST_ID,
  TOOLBAR_LIST_DROPDOWN_TEST_ID,
  TOOLBAR_REDO_BUTTON_TEST_ID,
  TOOLBAR_STRIKE_BUTTON_TEST_ID,
  TOOLBAR_SUBSCRIPT_BUTTON_TEST_ID,
  TOOLBAR_SUPERSCRIPT_BUTTON_TEST_ID,
  TOOLBAR_TABLE_BUTTON_TEST_ID,
  TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID,
  TOOLBAR_UNDERLINE_BUTTON_TEST_ID,
  TOOLBAR_UNDO_BUTTON_TEST_ID,
} from '../Toolbar'

const createMockChain = () => {
  const chainMethods: Record<string, jest.Mock> = {}
  const runMock = jest.fn()

  const handler: ProxyHandler<Record<string, jest.Mock>> = {
    get: (_target, prop: string) => {
      if (prop === 'run') return runMock
      if (!chainMethods[prop]) {
        chainMethods[prop] = jest.fn().mockReturnValue(new Proxy({}, handler))
      }

      return chainMethods[prop]
    },
  }

  return { proxy: new Proxy({}, handler), runMock, chainMethods }
}

const createMockEditor = (overrides: Record<string, boolean> = {}) => {
  const { proxy, runMock } = createMockChain()

  const defaults: Record<string, boolean> = {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    paragraph: true,
    bulletList: false,
    orderedList: false,
    code: false,
    codeBlock: false,
    heading: false,
    link: false,
    superscript: false,
    subscript: false,
    highlight: false,
    ...overrides,
  }

  return {
    editor: {
      isActive: jest.fn((type: string, attrs?: Record<string, unknown>) => {
        if (type === 'heading' && attrs?.level) {
          return defaults[`heading-${attrs.level}`] ?? false
        }
        if (typeof type === 'object') {
          const key = Object.values(type as Record<string, string>)[0]

          return defaults[`align-${key}`] ?? false
        }

        return defaults[type] ?? false
      }),
      can: jest.fn().mockReturnValue({
        undo: jest.fn().mockReturnValue(defaults.canUndo ?? false),
        redo: jest.fn().mockReturnValue(defaults.canRedo ?? false),
      }),
      chain: jest.fn().mockReturnValue(proxy),
    } as unknown as Editor,
    runMock,
  }
}

jest.mock('@tiptap/react', () => ({
  ...jest.requireActual('@tiptap/react'),
  useEditorState: jest.fn().mockImplementation(({ editor, selector }) => {
    if (selector) {
      return selector({ editor })
    }

    return {}
  }),
}))

describe('Toolbar', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the toolbar renders', () => {
    describe('WHEN editor is provided', () => {
      it('THEN should render the toolbar container', async () => {
        const { editor } = createMockEditor()

        await act(() => render(<Toolbar editor={editor} />))

        expect(screen.getByTestId(TOOLBAR_CONTAINER_TEST_ID)).toBeInTheDocument()
      })

      it.each([
        ['undo', TOOLBAR_UNDO_BUTTON_TEST_ID],
        ['redo', TOOLBAR_REDO_BUTTON_TEST_ID],
        ['bold', TOOLBAR_BOLD_BUTTON_TEST_ID],
        ['italic', TOOLBAR_ITALIC_BUTTON_TEST_ID],
        ['underline', TOOLBAR_UNDERLINE_BUTTON_TEST_ID],
        ['strike', TOOLBAR_STRIKE_BUTTON_TEST_ID],
        ['code', TOOLBAR_CODE_BUTTON_TEST_ID],
        ['highlight', TOOLBAR_HIGHLIGHT_BUTTON_TEST_ID],
        ['superscript', TOOLBAR_SUPERSCRIPT_BUTTON_TEST_ID],
        ['subscript', TOOLBAR_SUBSCRIPT_BUTTON_TEST_ID],
        ['table', TOOLBAR_TABLE_BUTTON_TEST_ID],
        ['code block', TOOLBAR_CODE_BLOCK_BUTTON_TEST_ID],
        ['image', TOOLBAR_IMAGE_BUTTON_TEST_ID],
      ])('THEN should render the %s button', async (_, testId) => {
        const { editor } = createMockEditor()

        await act(() => render(<Toolbar editor={editor} />))

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN undo/redo state', () => {
    describe('WHEN there is no undo history', () => {
      it('THEN should disable the undo button', async () => {
        const { editor } = createMockEditor()

        await act(() => render(<Toolbar editor={editor} />))

        expect(screen.getByTestId(TOOLBAR_UNDO_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN there is no redo history', () => {
      it('THEN should disable the redo button', async () => {
        const { editor } = createMockEditor()

        await act(() => render(<Toolbar editor={editor} />))

        expect(screen.getByTestId(TOOLBAR_REDO_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN undo is available', () => {
      it('THEN should enable the undo button', async () => {
        const { editor } = createMockEditor({ canUndo: true })

        await act(() => render(<Toolbar editor={editor} />))

        expect(screen.getByTestId(TOOLBAR_UNDO_BUTTON_TEST_ID)).not.toBeDisabled()
      })
    })

    describe('WHEN redo is available', () => {
      it('THEN should enable the redo button', async () => {
        const { editor } = createMockEditor({ canRedo: true })

        await act(() => render(<Toolbar editor={editor} />))

        expect(screen.getByTestId(TOOLBAR_REDO_BUTTON_TEST_ID)).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN formatting button clicks', () => {
    it.each([
      ['bold', TOOLBAR_BOLD_BUTTON_TEST_ID],
      ['italic', TOOLBAR_ITALIC_BUTTON_TEST_ID],
      ['underline', TOOLBAR_UNDERLINE_BUTTON_TEST_ID],
      ['strike', TOOLBAR_STRIKE_BUTTON_TEST_ID],
      ['code', TOOLBAR_CODE_BUTTON_TEST_ID],
      ['highlight', TOOLBAR_HIGHLIGHT_BUTTON_TEST_ID],
      ['superscript', TOOLBAR_SUPERSCRIPT_BUTTON_TEST_ID],
      ['subscript', TOOLBAR_SUBSCRIPT_BUTTON_TEST_ID],
      ['table', TOOLBAR_TABLE_BUTTON_TEST_ID],
      ['code block', TOOLBAR_CODE_BLOCK_BUTTON_TEST_ID],
    ])('WHEN the %s button is clicked THEN should call the editor chain', async (_, testId) => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor()

      await act(() => render(<Toolbar editor={editor} />))
      await user.click(screen.getByTestId(testId))

      expect(editor.chain).toHaveBeenCalled()
      expect(runMock).toHaveBeenCalled()
    })

    describe('WHEN the undo button is clicked', () => {
      it('THEN should call the editor chain', async () => {
        const user = userEvent.setup()
        const { editor, runMock } = createMockEditor({ canUndo: true })

        await act(() => render(<Toolbar editor={editor} />))
        await user.click(screen.getByTestId(TOOLBAR_UNDO_BUTTON_TEST_ID))

        expect(editor.chain).toHaveBeenCalled()
        expect(runMock).toHaveBeenCalled()
      })
    })

    describe('WHEN the redo button is clicked', () => {
      it('THEN should call the editor chain', async () => {
        const user = userEvent.setup()
        const { editor, runMock } = createMockEditor({ canRedo: true })

        await act(() => render(<Toolbar editor={editor} />))
        await user.click(screen.getByTestId(TOOLBAR_REDO_BUTTON_TEST_ID))

        expect(editor.chain).toHaveBeenCalled()
        expect(runMock).toHaveBeenCalled()
      })
    })
  })

  // Link popper form tests moved to LinkPopperForm.test.tsx

  describe('GIVEN the text styling dropdown', () => {
    const openDropdown = async (overrides: Record<string, boolean> = {}) => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor(overrides)

      await act(() => render(<Toolbar editor={editor} />))
      await user.click(screen.getByTestId(TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID))

      return { user, editor, runMock }
    }

    it.each([
      ['paragraph', `${TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID}-paragraph`],
      ['heading-1', `${TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID}-heading-1`],
      ['heading-2', `${TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID}-heading-2`],
      ['heading-3', `${TOOLBAR_TEXT_STYLING_DROPDOWN_TEST_ID}-heading-3`],
    ])('WHEN clicking %s THEN should call editor chain', async (_, itemTestId) => {
      const { user, editor, runMock } = await openDropdown()

      await waitFor(() => {
        expect(screen.getByTestId(itemTestId)).toBeInTheDocument()
      })

      await user.click(screen.getByTestId(itemTestId))

      expect(editor.chain).toHaveBeenCalled()
      expect(runMock).toHaveBeenCalled()
    })
  })

  describe('GIVEN the list styling dropdown', () => {
    const openDropdown = async (overrides: Record<string, boolean> = {}) => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor(overrides)

      await act(() => render(<Toolbar editor={editor} />))
      await user.click(screen.getByTestId(TOOLBAR_LIST_DROPDOWN_TEST_ID))

      return { user, editor, runMock }
    }

    it.each([
      ['bulletList', `${TOOLBAR_LIST_DROPDOWN_TEST_ID}-bulletList`],
      ['orderedList', `${TOOLBAR_LIST_DROPDOWN_TEST_ID}-orderedList`],
    ])('WHEN clicking %s THEN should call editor chain', async (_, itemTestId) => {
      const { user, editor, runMock } = await openDropdown()

      await waitFor(() => {
        expect(screen.getByTestId(itemTestId)).toBeInTheDocument()
      })

      await user.click(screen.getByTestId(itemTestId))

      expect(editor.chain).toHaveBeenCalled()
      expect(runMock).toHaveBeenCalled()
    })
  })

  describe('GIVEN the text align dropdown', () => {
    const openDropdown = async (overrides: Record<string, boolean> = {}) => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor(overrides)

      await act(() => render(<Toolbar editor={editor} />))
      await user.click(screen.getByTestId(TOOLBAR_ALIGN_DROPDOWN_TEST_ID))

      return { user, editor, runMock }
    }

    it.each([
      ['left', `${TOOLBAR_ALIGN_DROPDOWN_TEST_ID}-left`],
      ['center', `${TOOLBAR_ALIGN_DROPDOWN_TEST_ID}-center`],
      ['right', `${TOOLBAR_ALIGN_DROPDOWN_TEST_ID}-right`],
      ['justify', `${TOOLBAR_ALIGN_DROPDOWN_TEST_ID}-justify`],
    ])('WHEN clicking %s THEN should call editor chain', async (_, itemTestId) => {
      const { user, editor, runMock } = await openDropdown()

      await waitFor(() => {
        expect(screen.getByTestId(itemTestId)).toBeInTheDocument()
      })

      await user.click(screen.getByTestId(itemTestId))

      expect(editor.chain).toHaveBeenCalled()
      expect(runMock).toHaveBeenCalled()
    })
  })

  // Image popper form tests moved to ImagePopperForm.test.tsx
})
