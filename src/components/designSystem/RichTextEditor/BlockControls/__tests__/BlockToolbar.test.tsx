import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import BlockToolbar, {
  BLOCK_TOOLBAR_BG_COLOR_BUTTON_TEST_ID,
  BLOCK_TOOLBAR_DELETE_BUTTON_TEST_ID,
  BLOCK_TOOLBAR_TEST_ID,
  BLOCK_TOOLBAR_TEXT_COLOR_BUTTON_TEST_ID,
} from '../BlockToolbar'

const mockDeleteSelection = jest.fn()
const mockSetBlockBackgroundColor = jest.fn()
const mockSetBlockTextColor = jest.fn()

let mockSelectorReturn: unknown = null

jest.mock('@tiptap/react', () => ({
  ...jest.requireActual('@tiptap/react'),
  useEditorState: jest.fn(({ selector }: { selector?: (ctx: { editor: unknown }) => unknown }) => {
    if (selector) {
      return mockSelectorReturn
    }

    return null
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const createMockBlockElement = () => {
  const block = document.createElement('p')

  block.getBoundingClientRect = jest.fn().mockReturnValue({
    top: 100,
    left: 50,
    width: 400,
    height: 24,
    right: 450,
    bottom: 124,
  })

  return block
}

const createMockEditorContainer = () => {
  const container = document.createElement('div')

  container.className = 'rich-text-editor'
  container.getBoundingClientRect = jest.fn().mockReturnValue({
    top: 20,
    left: 10,
    width: 800,
    height: 600,
    right: 810,
    bottom: 620,
  })

  return container
}

const createMockEditor = (overrides?: {
  blockElement?: HTMLElement | null
  editorContainer?: HTMLElement | null
}) => {
  const blockElement =
    overrides && 'blockElement' in overrides ? overrides.blockElement : createMockBlockElement()
  const editorContainer =
    overrides && 'editorContainer' in overrides
      ? overrides.editorContainer
      : createMockEditorContainer()

  const editorDom = document.createElement('div')

  editorDom.closest = jest.fn().mockImplementation((selector: string) => {
    if (selector === '.rich-text-editor') return editorContainer

    return null
  })

  return {
    commands: {
      deleteSelection: mockDeleteSelection,
      setBlockBackgroundColor: mockSetBlockBackgroundColor,
      setBlockTextColor: mockSetBlockTextColor,
    },
    view: {
      nodeDOM: jest.fn().mockReturnValue(blockElement),
      dom: editorDom,
    },
    state: {
      selection: { from: 0 },
    },
  } as unknown as Parameters<typeof BlockToolbar>[0]['editor']
}

describe('BlockToolbar', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    mockSelectorReturn = null
  })

  describe('GIVEN no block is selected', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not render the toolbar', () => {
        mockSelectorReturn = null

        render(<BlockToolbar editor={createMockEditor()} />)

        expect(screen.queryByTestId(BLOCK_TOOLBAR_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a block is selected', () => {
    const blockSelection = {
      pos: 0,
      node: {},
      backgroundColor: null,
      textColor: null,
    }

    describe('WHEN the component renders with a valid position', () => {
      it('THEN should render the toolbar', () => {
        mockSelectorReturn = blockSelection

        render(<BlockToolbar editor={createMockEditor()} />)

        expect(screen.getByTestId(BLOCK_TOOLBAR_TEST_ID)).toBeInTheDocument()
      })

      it.each([
        ['delete button', BLOCK_TOOLBAR_DELETE_BUTTON_TEST_ID],
        ['background color button', BLOCK_TOOLBAR_BG_COLOR_BUTTON_TEST_ID],
        ['text color button', BLOCK_TOOLBAR_TEXT_COLOR_BUTTON_TEST_ID],
      ])('THEN should render the %s', (_, testId) => {
        mockSelectorReturn = blockSelection

        render(<BlockToolbar editor={createMockEditor()} />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it('THEN should position the toolbar relative to the block', () => {
        mockSelectorReturn = blockSelection

        render(<BlockToolbar editor={createMockEditor()} />)

        const toolbar = screen.getByTestId(BLOCK_TOOLBAR_TEST_ID)

        // block.top(100) - container.top(20) = 80
        expect(toolbar.style.top).toBe('80px')
        // block.left(50) - container.left(10) = 40
        expect(toolbar.style.left).toBe('40px')
      })
    })

    describe('WHEN the delete button is clicked', () => {
      it('THEN should call editor.commands.deleteSelection', async () => {
        const user = userEvent.setup()

        mockSelectorReturn = blockSelection

        render(<BlockToolbar editor={createMockEditor()} />)

        await user.click(screen.getByTestId(BLOCK_TOOLBAR_DELETE_BUTTON_TEST_ID))

        expect(mockDeleteSelection).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN nodeDOM returns null', () => {
      it('THEN should not render the toolbar', () => {
        mockSelectorReturn = blockSelection

        render(<BlockToolbar editor={createMockEditor({ blockElement: null })} />)

        expect(screen.queryByTestId(BLOCK_TOOLBAR_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the editor container is not found', () => {
      it('THEN should not render the toolbar', () => {
        mockSelectorReturn = blockSelection

        render(<BlockToolbar editor={createMockEditor({ editorContainer: null })} />)

        expect(screen.queryByTestId(BLOCK_TOOLBAR_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a block with existing colors is selected', () => {
    describe('WHEN the block has a backgroundColor', () => {
      it('THEN should display the background color swatch with that color', () => {
        mockSelectorReturn = {
          pos: 0,
          node: {},
          backgroundColor: '#fee2e2',
          textColor: null,
        }

        render(<BlockToolbar editor={createMockEditor()} />)

        const bgButton = screen.getByTestId(BLOCK_TOOLBAR_BG_COLOR_BUTTON_TEST_ID)
        const swatch = bgButton.querySelector('.size-4') as HTMLElement

        expect(swatch.style.backgroundColor).toBe('rgb(254, 226, 226)')
      })
    })

    describe('WHEN the block has a textColor', () => {
      it('THEN should display the text color indicator with that color', () => {
        mockSelectorReturn = {
          pos: 0,
          node: {},
          backgroundColor: null,
          textColor: '#dc2626',
        }

        render(<BlockToolbar editor={createMockEditor()} />)

        const textButton = screen.getByTestId(BLOCK_TOOLBAR_TEXT_COLOR_BUTTON_TEST_ID)
        const indicator = textButton.querySelector('.text-sm.font-bold') as HTMLElement

        expect(indicator.style.color).toBe('rgb(220, 38, 38)')
      })
    })
  })

  describe('GIVEN the useEditorState selector', () => {
    it('THEN should return null when selection is not a NodeSelection', () => {
      const tiptap = jest.requireMock('@tiptap/react')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let capturedSelector: any = null

      tiptap.useEditorState.mockImplementation(
        ({ selector }: { selector: (ctx: { editor: unknown }) => unknown }) => {
          capturedSelector = selector

          return mockSelectorReturn
        },
      )

      const mockEditor = createMockEditor()

      render(<BlockToolbar editor={mockEditor} />)

      const result = capturedSelector?.({
        editor: {
          state: { selection: { from: 0 } },
          view: { dragging: null },
        },
      })

      expect(result).toBeNull()

      tiptap.useEditorState.mockImplementation(
        ({ selector }: { selector?: (ctx: { editor: unknown }) => unknown }) => {
          if (selector) return mockSelectorReturn

          return null
        },
      )
    })
  })
})
