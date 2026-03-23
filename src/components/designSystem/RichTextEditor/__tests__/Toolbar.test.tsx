import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/react'

import { render } from '~/test-utils'

import Toolbar, {
  TOOLBAR_BOLD_BUTTON_TEST_ID,
  TOOLBAR_CODE_BLOCK_BUTTON_TEST_ID,
  TOOLBAR_CODE_BUTTON_TEST_ID,
  TOOLBAR_CONTAINER_TEST_ID,
  TOOLBAR_HIGHLIGHT_BUTTON_TEST_ID,
  TOOLBAR_ITALIC_BUTTON_TEST_ID,
  TOOLBAR_LINK_APPLY_BUTTON_TEST_ID,
  TOOLBAR_LINK_INPUT_TEST_ID,
  TOOLBAR_REDO_BUTTON_TEST_ID,
  TOOLBAR_STRIKE_BUTTON_TEST_ID,
  TOOLBAR_SUBSCRIPT_BUTTON_TEST_ID,
  TOOLBAR_SUPERSCRIPT_BUTTON_TEST_ID,
  TOOLBAR_TABLE_BUTTON_TEST_ID,
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
  const { proxy } = createMockChain()

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
  } as unknown as Editor
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
        await act(() => render(<Toolbar editor={createMockEditor()} />))

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
      ])('THEN should render the %s button', async (_, testId) => {
        await act(() => render(<Toolbar editor={createMockEditor()} />))

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN undo/redo state', () => {
    describe('WHEN there is no undo history', () => {
      it('THEN should disable the undo button', async () => {
        await act(() => render(<Toolbar editor={createMockEditor()} />))

        expect(screen.getByTestId(TOOLBAR_UNDO_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN there is no redo history', () => {
      it('THEN should disable the redo button', async () => {
        await act(() => render(<Toolbar editor={createMockEditor()} />))

        expect(screen.getByTestId(TOOLBAR_REDO_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN undo is available', () => {
      it('THEN should enable the undo button', async () => {
        await act(() => render(<Toolbar editor={createMockEditor({ canUndo: true })} />))

        expect(screen.getByTestId(TOOLBAR_UNDO_BUTTON_TEST_ID)).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN formatting button clicks', () => {
    describe('WHEN the bold button is clicked', () => {
      it('THEN should call the editor chain', async () => {
        const user = userEvent.setup()
        const editor = createMockEditor()

        await act(() => render(<Toolbar editor={editor} />))
        await user.click(screen.getByTestId(TOOLBAR_BOLD_BUTTON_TEST_ID))

        expect(editor.chain).toHaveBeenCalled()
      })
    })

    describe('WHEN the table button is clicked', () => {
      it('THEN should call the editor chain', async () => {
        const user = userEvent.setup()
        const editor = createMockEditor()

        await act(() => render(<Toolbar editor={editor} />))
        await user.click(screen.getByTestId(TOOLBAR_TABLE_BUTTON_TEST_ID))

        expect(editor.chain).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the link popper', () => {
    describe('WHEN opening the link popper and entering a URL', () => {
      it('THEN should call editor chain when apply is clicked', async () => {
        const user = userEvent.setup()
        const editor = createMockEditor()

        await act(() => render(<Toolbar editor={editor} />))

        // Click the link button (the one with the link icon)
        const linkButton = screen.getByTestId('link/medium')

        await user.click(linkButton)

        await waitFor(() => {
          expect(screen.getByTestId(TOOLBAR_LINK_INPUT_TEST_ID)).toBeInTheDocument()
        })

        const input = screen.getByTestId(TOOLBAR_LINK_INPUT_TEST_ID)

        await user.type(input, 'https://example.com')
        await user.click(screen.getByTestId(TOOLBAR_LINK_APPLY_BUTTON_TEST_ID))

        expect(editor.chain).toHaveBeenCalled()
      })
    })
  })
})
