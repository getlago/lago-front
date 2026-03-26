import { act, cleanup, screen } from '@testing-library/react'
import { Markdown } from 'tiptap-markdown'

import { render } from '~/test-utils'

import RichTextEditor, { RICH_TEXT_EDITOR_TEST_ID } from '../RichTextEditor'

// Capture the config passed to SlashCommands.configure()
let capturedSlashCommandsConfig: Record<string, unknown> = {}

jest.mock('../extensions/PlanBlock', () => ({
  PlanBlock: 'plan-block-extension',
}))

jest.mock('../extensions/SlashCommands', () => ({
  SlashCommands: {
    configure: jest.fn((config: Record<string, unknown>) => {
      capturedSlashCommandsConfig = config

      return 'slash-commands-extension'
    }),
  },
  slashCommandDefinitions: [],
}))

const mockGetMarkdown = jest.fn().mockReturnValue('# Hello World')

const mockEditor = {
  setEditable: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  state: { selection: { from: 0 } },
  view: {
    domAtPos: jest.fn().mockReturnValue({ node: document.createElement('div') }),
    posAtDOM: jest.fn().mockReturnValue(0),
  },
  extensionManager: {
    extensions: [
      {
        name: Markdown.name,
        storage: {
          getMarkdown: mockGetMarkdown,
        },
      },
    ],
  } as { extensions: Array<{ name: string; storage: unknown }> },
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

// Capture the config passed to Mention.extend() and Mention.configure()
let capturedMentionConfig: Record<string, unknown> = {}
let capturedMentionExtendConfig: Record<string, unknown> = {}

jest.mock('@tiptap/extension-mention', () => ({
  __esModule: true,
  default: {
    extend: jest.fn((extendConfig: Record<string, unknown>) => {
      capturedMentionExtendConfig = extendConfig

      return {
        configure: jest.fn((config: Record<string, unknown>) => {
          capturedMentionConfig = config

          return 'mention-extension'
        }),
      }
    }),
    configure: jest.fn((config: Record<string, unknown>) => {
      capturedMentionConfig = config

      return 'mention-extension'
    }),
  },
}))

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

  describe('GIVEN the mention extension is configured', () => {
    beforeEach(async () => {
      await act(() => render(<RichTextEditor />))
    })

    it('THEN should set the trigger character to @', () => {
      const suggestion = capturedMentionConfig.suggestion as { char: string }

      expect(suggestion.char).toBe('@')
    })

    it('THEN should set the variable-mention CSS class', () => {
      const attrs = capturedMentionConfig.HTMLAttributes as { class: string }

      expect(attrs.class).toBe('variable-mention')
    })

    describe('WHEN filtering items with an empty query', () => {
      it('THEN should return all 6 variable items', () => {
        const suggestion = capturedMentionConfig.suggestion as {
          items: (args: { query: string }) => { id: string; label: string }[]
        }
        const results = suggestion.items({ query: '' })

        expect(results).toHaveLength(6)
      })
    })

    describe('WHEN filtering items with a matching query', () => {
      it.each([
        ['name', 3, ['Customer Name', 'Plan Name', 'Company Name']],
        ['invoice', 1, ['Invoice Number']],
        ['due', 2, ['Amount Due', 'Due Date']],
      ])(
        'THEN should return matching items for query "%s"',
        (query, expectedCount, expectedLabels) => {
          const suggestion = capturedMentionConfig.suggestion as {
            items: (args: { query: string }) => { id: string; label: string }[]
          }
          const results = suggestion.items({ query })

          expect(results).toHaveLength(expectedCount)
          expect(results.map((r) => r.label)).toEqual(expectedLabels)
        },
      )
    })

    describe('WHEN filtering items case-insensitively', () => {
      it('THEN should match regardless of case', () => {
        const suggestion = capturedMentionConfig.suggestion as {
          items: (args: { query: string }) => { id: string; label: string }[]
        }
        const upper = suggestion.items({ query: 'PLAN' })
        const lower = suggestion.items({ query: 'plan' })
        const mixed = suggestion.items({ query: 'PlAn' })

        expect(upper).toHaveLength(1)
        expect(lower).toHaveLength(1)
        expect(mixed).toHaveLength(1)
        expect(upper[0].label).toBe('Plan Name')
      })
    })

    describe('WHEN filtering items with a non-matching query', () => {
      it('THEN should return an empty array', () => {
        const suggestion = capturedMentionConfig.suggestion as {
          items: (args: { query: string }) => { id: string; label: string }[]
        }
        const results = suggestion.items({ query: 'nonexistent' })

        expect(results).toHaveLength(0)
      })
    })

    describe('WHEN renderHTML is called with a node that has a label', () => {
      it('THEN should render a span with @label text', () => {
        const renderHTML = capturedMentionConfig.renderHTML as (args: {
          node: { attrs: { id: string; label?: string } }
        }) => unknown[]

        const result = renderHTML({
          node: { attrs: { id: 'customerName', label: 'Customer Name' } },
        })

        expect(result).toEqual([
          'span',
          { 'data-type': 'mention', 'data-id': 'customerName', class: 'variable-mention' },
          '@Customer Name',
        ])
      })
    })

    describe('WHEN renderHTML is called with a node that has no label', () => {
      it('THEN should fallback to @id text', () => {
        const renderHTML = capturedMentionConfig.renderHTML as (args: {
          node: { attrs: { id: string; label?: string } }
        }) => unknown[]

        const result = renderHTML({ node: { attrs: { id: 'customerName' } } })

        expect(result).toEqual([
          'span',
          { 'data-type': 'mention', 'data-id': 'customerName', class: 'variable-mention' },
          '@customerName',
        ])
      })
    })
  })

  describe('GIVEN the editor is in preview mode', () => {
    describe('WHEN mode is set to preview', () => {
      it('THEN should not render the toolbar', async () => {
        await act(() => render(<RichTextEditor mode="preview" />))

        expect(screen.queryByTestId('toolbar-container')).not.toBeInTheDocument()
      })

      it('THEN should still render the editor content', async () => {
        await act(() => render(<RichTextEditor mode="preview" />))

        expect(screen.getByTestId('editor-content')).toBeInTheDocument()
      })

      it('THEN should set the editor to non-editable', async () => {
        await act(() => render(<RichTextEditor mode="preview" />))

        expect(mockEditor.setEditable).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('GIVEN the editor is in edit mode', () => {
    describe('WHEN mode is set to edit', () => {
      it('THEN should render the toolbar', async () => {
        await act(() => render(<RichTextEditor mode="edit" />))

        expect(screen.getByTestId('toolbar-container')).toBeInTheDocument()
      })

      it('THEN should set the editor to editable', async () => {
        await act(() => render(<RichTextEditor mode="edit" />))

        expect(mockEditor.setEditable).toHaveBeenCalledWith(true)
      })
    })

    describe('WHEN mode is not specified', () => {
      it('THEN should default to edit mode and render the toolbar', async () => {
        await act(() => render(<RichTextEditor />))

        expect(screen.getByTestId('toolbar-container')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the slash commands extension is configured', () => {
    beforeEach(async () => {
      await act(() => render(<RichTextEditor />))
    })

    it('THEN should pass a translate function to SlashCommands.configure', () => {
      expect(capturedSlashCommandsConfig.translate).toBeDefined()
      expect(typeof capturedSlashCommandsConfig.translate).toBe('function')
    })
  })

  describe('GIVEN the getMarkdownRef prop is provided', () => {
    describe('WHEN the editor is initialized', () => {
      it('THEN should assign a function to getMarkdownRef.current', async () => {
        const getMarkdownRef = { current: null } as React.MutableRefObject<(() => string) | null>

        await act(() => render(<RichTextEditor getMarkdownRef={getMarkdownRef} />))

        expect(typeof getMarkdownRef.current).toBe('function')
      })

      it('THEN should return markdown content when called', async () => {
        const getMarkdownRef = { current: null } as React.MutableRefObject<(() => string) | null>

        await act(() => render(<RichTextEditor getMarkdownRef={getMarkdownRef} />))

        const result = getMarkdownRef.current?.()

        expect(mockGetMarkdown).toHaveBeenCalled()
        expect(result).toBe('# Hello World')
      })
    })

    describe('WHEN the markdown extension is not found', () => {
      it('THEN should return undefined', async () => {
        const getMarkdownRef = { current: null } as React.MutableRefObject<(() => string) | null>
        const originalExtensions = mockEditor.extensionManager.extensions

        mockEditor.extensionManager.extensions = []

        await act(() => render(<RichTextEditor getMarkdownRef={getMarkdownRef} />))

        const result = getMarkdownRef.current?.()

        expect(result).toBeUndefined()

        mockEditor.extensionManager.extensions = originalExtensions
      })
    })

    describe('WHEN the markdown extension storage has no getMarkdown function', () => {
      it('THEN should return undefined', async () => {
        const getMarkdownRef = { current: null } as React.MutableRefObject<(() => string) | null>
        const originalExtensions = mockEditor.extensionManager.extensions

        mockEditor.extensionManager.extensions = [{ name: 'markdown', storage: {} }]

        await act(() => render(<RichTextEditor getMarkdownRef={getMarkdownRef} />))

        const result = getMarkdownRef.current?.()

        expect(result).toBeUndefined()

        mockEditor.extensionManager.extensions = originalExtensions
      })
    })
  })

  describe('GIVEN the mention extension addStorage config', () => {
    beforeEach(async () => {
      await act(() => render(<RichTextEditor />))
    })

    describe('WHEN serialize is called with a mention node that has a label', () => {
      it('THEN should write the mention in {id|label} format', () => {
        const addStorage = capturedMentionExtendConfig.addStorage as () => {
          markdown: {
            serialize: (
              state: { write: (text: string) => void },
              node: { attrs: { id: string; label?: string } },
            ) => void
          }
        }
        const storage = addStorage()
        const mockWrite = jest.fn()

        storage.markdown.serialize(
          { write: mockWrite },
          { attrs: { id: 'customerName', label: 'Customer Name' } },
        )

        expect(mockWrite).toHaveBeenCalledWith('{customerName|Customer Name}')
      })
    })

    describe('WHEN serialize is called with a mention node that has no label', () => {
      it('THEN should fallback to using id as the label', () => {
        const addStorage = capturedMentionExtendConfig.addStorage as () => {
          markdown: {
            serialize: (
              state: { write: (text: string) => void },
              node: { attrs: { id: string; label?: string } },
            ) => void
          }
        }
        const storage = addStorage()
        const mockWrite = jest.fn()

        storage.markdown.serialize({ write: mockWrite }, { attrs: { id: 'planName' } })

        expect(mockWrite).toHaveBeenCalledWith('{planName|planName}')
      })
    })

    describe('WHEN parse.updateDOM is called', () => {
      it('THEN should replace mention placeholders with span elements', () => {
        const addStorage = capturedMentionExtendConfig.addStorage as () => {
          markdown: {
            parse: {
              updateDOM: (element: HTMLElement) => void
            }
          }
        }
        const storage = addStorage()
        const mockElement = {
          innerHTML: 'Hello {{customerName|Customer Name}}, your plan is {{planName|Pro Plan}}.',
        } as HTMLElement

        storage.markdown.parse.updateDOM(mockElement)

        expect(mockElement.innerHTML).toContain('data-type="mention"')
        expect(mockElement.innerHTML).toContain('data-id="customerName"')
        expect(mockElement.innerHTML).toContain('@Customer Name')
        expect(mockElement.innerHTML).toContain('data-id="planName"')
        expect(mockElement.innerHTML).toContain('@Pro Plan')
      })

      it('THEN should not modify content without mention placeholders', () => {
        const addStorage = capturedMentionExtendConfig.addStorage as () => {
          markdown: {
            parse: {
              updateDOM: (element: HTMLElement) => void
            }
          }
        }
        const storage = addStorage()
        const mockElement = { innerHTML: 'No mentions here.' } as HTMLElement

        storage.markdown.parse.updateDOM(mockElement)

        expect(mockElement.innerHTML).toBe('No mentions here.')
      })
    })
  })

  describe('GIVEN the mention suggestion render callbacks', () => {
    const getMockSuggestionProps = () => ({
      editor: mockEditor,
      clientRect: jest.fn().mockReturnValue({ top: 0, left: 0, width: 100, height: 20 }),
    })

    beforeEach(async () => {
      await act(() => render(<RichTextEditor />))
    })

    describe('WHEN onStart is called', () => {
      it('THEN should create a renderer and popup', () => {
        const suggestion = capturedMentionConfig.suggestion as {
          render: () => {
            onStart: (props: unknown) => void
            onUpdate: (props: unknown) => void
            onKeyDown: (props: { event: KeyboardEvent }) => boolean
            onExit: () => void
          }
        }

        const callbacks = suggestion.render()
        const props = getMockSuggestionProps()

        expect(() => callbacks.onStart(props)).not.toThrow()
      })
    })

    describe('WHEN onUpdate is called after onStart', () => {
      it('THEN should update the renderer and popup', () => {
        const suggestion = capturedMentionConfig.suggestion as {
          render: () => {
            onStart: (props: unknown) => void
            onUpdate: (props: unknown) => void
            onKeyDown: (props: { event: KeyboardEvent }) => boolean
            onExit: () => void
          }
        }

        const callbacks = suggestion.render()
        const props = getMockSuggestionProps()

        callbacks.onStart(props)
        expect(() => callbacks.onUpdate(props)).not.toThrow()
      })
    })

    describe('WHEN onKeyDown is called with Escape key', () => {
      it('THEN should return true', () => {
        const suggestion = capturedMentionConfig.suggestion as {
          render: () => {
            onStart: (props: unknown) => void
            onUpdate: (props: unknown) => void
            onKeyDown: (props: { event: KeyboardEvent }) => boolean
            onExit: () => void
          }
        }

        const callbacks = suggestion.render()

        callbacks.onStart(getMockSuggestionProps())

        const result = callbacks.onKeyDown({
          event: new KeyboardEvent('keydown', { key: 'Escape' }),
        })

        expect(result).toBe(true)
      })
    })

    describe('WHEN onKeyDown is called with a non-Escape key', () => {
      it('THEN should return false when renderer ref has no onKeyDown', () => {
        const suggestion = capturedMentionConfig.suggestion as {
          render: () => {
            onStart: (props: unknown) => void
            onUpdate: (props: unknown) => void
            onKeyDown: (props: { event: KeyboardEvent }) => boolean
            onExit: () => void
          }
        }

        const callbacks = suggestion.render()

        callbacks.onStart(getMockSuggestionProps())

        const result = callbacks.onKeyDown({
          event: new KeyboardEvent('keydown', { key: 'Enter' }),
        })

        expect(result).toBe(false)
      })
    })

    describe('WHEN onExit is called', () => {
      it('THEN should clean up the popup and renderer', () => {
        const suggestion = capturedMentionConfig.suggestion as {
          render: () => {
            onStart: (props: unknown) => void
            onUpdate: (props: unknown) => void
            onKeyDown: (props: { event: KeyboardEvent }) => boolean
            onExit: () => void
          }
        }

        const callbacks = suggestion.render()

        callbacks.onStart(getMockSuggestionProps())
        expect(() => callbacks.onExit()).not.toThrow()
      })
    })
  })
})
