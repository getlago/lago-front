import { act, cleanup, screen } from '@testing-library/react'
import { Markdown } from 'tiptap-markdown'

import { render } from '~/test-utils'

import RichTextEditor, {
  RICH_TEXT_EDITOR_CONTENT_TEST_ID,
  RICH_TEXT_EDITOR_TEST_ID,
} from '../RichTextEditor'

// Capture the config passed to SlashCommands.configure()
let capturedSlashCommandsConfig: Record<string, unknown> = {}

const mockDownloadMarkdownPdf = jest.fn()

jest.mock('../common/downloadMarkdownPdf', () => ({
  downloadMarkdownPdf: (...args: unknown[]) => mockDownloadMarkdownPdf(...args),
}))

jest.mock('../extensions/PlanBlock', () => ({
  PlanBlock: {
    configure: jest.fn(() => 'plan-block-extension'),
  },
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
  storage: {
    markdown: {
      getMarkdown: mockGetMarkdown,
    },
  } as Record<string, unknown>,
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
  getHTML: jest.fn().mockReturnValue('<p>Preview content</p>'),
  isActive: jest.fn().mockReturnValue(false),
  getAttributes: jest.fn().mockReturnValue({}),
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

// Capture the config passed to MentionSchema.extend() and .configure()
let capturedMentionConfig: Record<string, unknown> = {}
let capturedMentionExtendConfig: Record<string, unknown> = {}

jest.mock('../extensions/Mention.schema', () => ({
  MentionSchema: {
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
  configureMention: jest.fn(() => 'configured-mention-extension'),
  mentionBaseConfig: {
    HTMLAttributes: { class: 'variable-mention' },
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

    it('THEN should include mentionBaseConfig properties', () => {
      const attrs = capturedMentionConfig.HTMLAttributes as { class: string }

      expect(attrs.class).toBe('variable-mention')
    })

    it('THEN should pass mentionValues to the config', () => {
      expect(capturedMentionConfig.mentionValues).toBeDefined()
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
  })

  describe('GIVEN the editor is in preview mode', () => {
    describe('WHEN mode is set to preview', () => {
      it('THEN should not render the toolbar', async () => {
        await act(() => render(<RichTextEditor mode="preview" />))

        expect(screen.queryByTestId('toolbar-container')).not.toBeInTheDocument()
      })

      it('THEN should render the editor content via getHTML()', async () => {
        await act(() => render(<RichTextEditor mode="preview" />))

        expect(mockGetMarkdown).toHaveBeenCalled()
        expect(screen.getByTestId(RICH_TEXT_EDITOR_CONTENT_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the editor container', async () => {
        await act(() => render(<RichTextEditor mode="preview" />))

        expect(screen.getByTestId(RICH_TEXT_EDITOR_TEST_ID)).toBeInTheDocument()
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
        const originalStorage = mockEditor.storage

        mockEditor.storage = {}

        await act(() => render(<RichTextEditor getMarkdownRef={getMarkdownRef} />))

        const result = getMarkdownRef.current?.()

        expect(result).toBe('')

        mockEditor.storage = originalStorage
      })
    })

    describe('WHEN the markdown extension storage has no getMarkdown function', () => {
      it('THEN should return undefined', async () => {
        const getMarkdownRef = { current: null } as React.MutableRefObject<(() => string) | null>
        const originalStorage = mockEditor.storage

        mockEditor.storage = { markdown: {} }

        await act(() => render(<RichTextEditor getMarkdownRef={getMarkdownRef} />))

        const result = getMarkdownRef.current?.()

        expect(result).toBe('')

        mockEditor.storage = originalStorage
      })
    })
  })

  describe('GIVEN the mention extension addNodeView config', () => {
    beforeEach(async () => {
      await act(() => render(<RichTextEditor />))
    })

    it('THEN should provide an addNodeView function', () => {
      expect(capturedMentionExtendConfig.addNodeView).toBeDefined()
      expect(typeof capturedMentionExtendConfig.addNodeView).toBe('function')
    })
  })

  describe('GIVEN the downloadPdfRef prop is provided', () => {
    beforeEach(() => {
      mockDownloadMarkdownPdf.mockClear()
    })

    describe('WHEN the editor is initialized', () => {
      it('THEN should assign a function to downloadPdfRef.current', async () => {
        const downloadPdfRef = { current: null } as React.MutableRefObject<(() => void) | null>

        await act(() => render(<RichTextEditor downloadPdfRef={downloadPdfRef} />))

        expect(typeof downloadPdfRef.current).toBe('function')
      })
    })

    describe('WHEN the download function is called', () => {
      it('THEN should call downloadMarkdownPdf with the editor markdown and context', async () => {
        const downloadPdfRef = { current: null } as React.MutableRefObject<(() => void) | null>
        const mentionValues = { customerName: 'Acme Corp' }

        await act(() =>
          render(<RichTextEditor downloadPdfRef={downloadPdfRef} mentionValues={mentionValues} />),
        )

        await act(() => {
          downloadPdfRef.current?.()
        })

        expect(mockDownloadMarkdownPdf).toHaveBeenCalledTimes(1)
        expect(mockDownloadMarkdownPdf).toHaveBeenCalledWith({
          markdown: '# Hello World',
          mentionValues,
          plans: expect.any(Object),
        })
      })
    })

    describe('WHEN the markdown extension is not available', () => {
      it('THEN should not call downloadMarkdownPdf', async () => {
        const downloadPdfRef = { current: null } as React.MutableRefObject<(() => void) | null>
        const originalStorage = mockEditor.storage

        mockEditor.storage = {}

        await act(() => render(<RichTextEditor downloadPdfRef={downloadPdfRef} />))

        await act(() => {
          downloadPdfRef.current?.()
        })

        expect(mockDownloadMarkdownPdf).not.toHaveBeenCalled()

        mockEditor.storage = originalStorage
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

    it('THEN should have render callbacks defined', () => {
      const suggestion = capturedMentionConfig.suggestion as {
        render: () => Record<string, unknown>
      }

      expect(suggestion.render).toBeDefined()

      const callbacks = suggestion.render()

      expect(callbacks.onStart).toBeDefined()
      expect(callbacks.onUpdate).toBeDefined()
      expect(callbacks.onKeyDown).toBeDefined()
      expect(callbacks.onExit).toBeDefined()
    })

    it('THEN onKeyDown should return true when Escape is pressed', () => {
      const suggestion = capturedMentionConfig.suggestion as {
        render: () => {
          onStart: (props: Record<string, unknown>) => void
          onKeyDown: (props: Record<string, unknown>) => boolean
          onExit: () => void
        }
      }

      const callbacks = suggestion.render()

      callbacks.onStart(getMockSuggestionProps())

      const result = callbacks.onKeyDown({ event: { key: 'Escape' } })

      expect(result).toBe(true)

      callbacks.onExit()
    })

    it('THEN onKeyDown should delegate to renderer.ref.onKeyDown for non-Escape keys', () => {
      const suggestion = capturedMentionConfig.suggestion as {
        render: () => {
          onStart: (props: Record<string, unknown>) => void
          onKeyDown: (props: { event: { key: string } }) => boolean
          onExit: () => void
        }
      }

      const callbacks = suggestion.render()

      callbacks.onStart(getMockSuggestionProps())

      // renderer.ref is undefined at this point, so it should return false
      const result = callbacks.onKeyDown({ event: { key: 'ArrowDown' } })

      expect(result).toBe(false)

      callbacks.onExit()
    })

    it('THEN onUpdate should update renderer props and popup position', () => {
      const suggestion = capturedMentionConfig.suggestion as {
        render: () => {
          onStart: (props: Record<string, unknown>) => void
          onUpdate: (props: Record<string, unknown>) => void
          onExit: () => void
        }
      }

      const callbacks = suggestion.render()

      callbacks.onStart(getMockSuggestionProps())

      // Should not throw when called with updated props
      expect(() => {
        callbacks.onUpdate(getMockSuggestionProps())
      }).not.toThrow()

      callbacks.onExit()
    })

    it('THEN onStart should handle null clientRect gracefully', () => {
      const suggestion = capturedMentionConfig.suggestion as {
        render: () => {
          onStart: (props: Record<string, unknown>) => void
          onExit: () => void
        }
      }

      const callbacks = suggestion.render()

      expect(() => {
        callbacks.onStart({
          editor: mockEditor,
          clientRect: null,
        })
      }).not.toThrow()

      callbacks.onExit()
    })
  })

  describe('GIVEN the onUpdate callback for plan block tracking', () => {
    const getLastUseEditorConfig = () => {
      const tiptap = jest.requireMock('@tiptap/react') as { useEditor: jest.Mock }
      const lastCall = tiptap.useEditor.mock.calls.at(-1)

      return lastCall?.[0] as Record<string, unknown>
    }

    it('THEN should call onPlanBlocksChange with plan IDs from the document', async () => {
      const onPlanBlocksChange = jest.fn()

      await act(() => render(<RichTextEditor onPlanBlocksChange={onPlanBlocksChange} />))

      const config = getLastUseEditorConfig()
      const onUpdate = config.onUpdate as (args: {
        editor: { state: { doc: { descendants: (cb: (node: unknown) => void) => void } } }
      }) => void

      const mockEditorInstance = {
        state: {
          doc: {
            descendants: (
              cb: (node: { type: { name: string }; attrs: { planId?: string } }) => void,
            ) => {
              cb({ type: { name: 'planBlock' }, attrs: { planId: 'plan-1' } })
              cb({ type: { name: 'paragraph' }, attrs: {} })
              cb({ type: { name: 'planBlock' }, attrs: { planId: 'plan-2' } })
            },
          },
        },
      }

      onUpdate({ editor: mockEditorInstance })

      expect(onPlanBlocksChange).toHaveBeenCalledWith(['plan-1', 'plan-2'])
    })

    it('THEN should skip nodes without planId', async () => {
      const onPlanBlocksChange = jest.fn()

      await act(() => render(<RichTextEditor onPlanBlocksChange={onPlanBlocksChange} />))

      const config = getLastUseEditorConfig()
      const onUpdate = config.onUpdate as (args: {
        editor: { state: { doc: { descendants: (cb: (node: unknown) => void) => void } } }
      }) => void

      const mockEditorInstance = {
        state: {
          doc: {
            descendants: (
              cb: (node: { type: { name: string }; attrs: { planId?: string } }) => void,
            ) => {
              cb({ type: { name: 'planBlock' }, attrs: {} })
              cb({ type: { name: 'planBlock' }, attrs: { planId: '' } })
            },
          },
        },
      }

      onUpdate({ editor: mockEditorInstance })

      expect(onPlanBlocksChange).toHaveBeenCalledWith([])
    })

    it('THEN should early-return when onPlanBlocksChange is not provided', async () => {
      await act(() => render(<RichTextEditor />))

      const config = getLastUseEditorConfig()
      const onUpdate = config.onUpdate as (args: {
        editor: { state: { doc: { descendants: jest.Mock } } }
      }) => void

      const mockDescendants = jest.fn()
      const mockEditorInstance = {
        state: { doc: { descendants: mockDescendants } },
      }

      onUpdate({ editor: mockEditorInstance })

      expect(mockDescendants).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the placeholder configuration', () => {
    const getPlaceholderFn = () => {
      const tiptap = jest.requireMock('@tiptap/react') as { useEditor: jest.Mock }
      const lastCall = tiptap.useEditor.mock.calls.at(-1)
      const config = lastCall?.[0] as { extensions: unknown[] }
      const extensions = config?.extensions ?? []

      for (const ext of extensions) {
        if (
          ext &&
          typeof ext === 'object' &&
          'options' in ext &&
          (ext as { options: { placeholder?: unknown } }).options?.placeholder
        ) {
          return (ext as { options: { placeholder: (args: unknown) => string } }).options
            .placeholder
        }
      }

      return null
    }

    beforeEach(async () => {
      await act(() => render(<RichTextEditor />))
    })

    it('THEN should return different placeholders for heading levels 1-4', () => {
      const placeholder = getPlaceholderFn()

      if (!placeholder) {
        throw new Error('Placeholder config not found')
      }

      const mockEditorInstance = {
        state: { doc: { descendants: jest.fn() } },
      }

      const h1 = placeholder({
        editor: mockEditorInstance,
        node: { type: { name: 'heading' }, attrs: { level: 1 } },
      })
      const h2 = placeholder({
        editor: mockEditorInstance,
        node: { type: { name: 'heading' }, attrs: { level: 2 } },
      })
      const h3 = placeholder({
        editor: mockEditorInstance,
        node: { type: { name: 'heading' }, attrs: { level: 3 } },
      })
      const h4 = placeholder({
        editor: mockEditorInstance,
        node: { type: { name: 'heading' }, attrs: { level: 4 } },
      })

      // Each heading level should have a unique, non-empty placeholder
      expect(h1).toBeTruthy()
      expect(h2).toBeTruthy()
      expect(h3).toBeTruthy()
      expect(h4).toBeTruthy()
      expect(new Set([h1, h2, h3, h4]).size).toBe(4)
    })

    it('THEN should return empty string for codeBlock nodes', () => {
      const placeholder = getPlaceholderFn()

      if (!placeholder) {
        throw new Error('Placeholder config not found')
      }

      const mockEditorInstance = {
        state: { doc: { descendants: jest.fn() } },
      }

      const result = placeholder({
        editor: mockEditorInstance,
        node: { type: { name: 'codeBlock' }, attrs: {} },
      })

      expect(result).toBe('')
    })

    it('THEN should return template placeholder when doc has templateSelector', () => {
      const placeholder = getPlaceholderFn()

      if (!placeholder) {
        throw new Error('Placeholder config not found')
      }

      const mockEditorInstance = {
        state: {
          doc: {
            descendants: (cb: (node: { type: { name: string } }) => boolean | void) => {
              cb({ type: { name: 'paragraph' } })
              cb({ type: { name: 'templateSelector' } })
            },
          },
        },
      }

      const result = placeholder({
        editor: mockEditorInstance,
        node: { type: { name: 'paragraph' }, attrs: {} },
      })

      // Should return a different placeholder than the default when template selector is present
      const defaultPlaceholder = placeholder({
        editor: {
          state: { doc: { descendants: jest.fn() } },
        },
        node: { type: { name: 'paragraph' }, attrs: {} },
      })

      expect(result).toBeTruthy()
      expect(result).not.toBe(defaultPlaceholder)
    })

    it('THEN should return default placeholder for paragraph without templateSelector', () => {
      const placeholder = getPlaceholderFn()

      if (!placeholder) {
        throw new Error('Placeholder config not found')
      }

      const mockEditorInstance = {
        state: {
          doc: {
            descendants: (cb: (node: { type: { name: string } }) => boolean | void) => {
              cb({ type: { name: 'paragraph' } })
            },
          },
        },
      }

      const result = placeholder({
        editor: mockEditorInstance,
        node: { type: { name: 'paragraph' }, attrs: {} },
      })

      expect(result).toBeTruthy()
    })
  })

  describe('GIVEN the content configuration', () => {
    const getLastUseEditorConfig = () => {
      const tiptap = jest.requireMock('@tiptap/react') as { useEditor: jest.Mock }
      const lastCall = tiptap.useEditor.mock.calls.at(-1)

      return lastCall?.[0] as Record<string, unknown>
    }

    it('THEN should use templates when provided and no content is given', async () => {
      const templates = [
        { id: 't1', name: 'Template 1', description: 'Test', content: '<p>Hello</p>' },
      ]

      await act(() => render(<RichTextEditor templates={templates} />))

      const config = getLastUseEditorConfig()
      const content = config.content as {
        type: string
        content: Array<{ type: string; attrs?: unknown }>
      }

      expect(content.type).toBe('doc')
      expect(content.content).toHaveLength(2)
      expect(content.content[0].type).toBe('paragraph')
      expect(content.content[1].type).toBe('templateSelector')
      expect(content.content[1].attrs).toEqual({ templates })
    })

    it('THEN should use content prop when provided', async () => {
      await act(() =>
        render(
          <RichTextEditor
            content="<p>Custom content</p>"
            templates={[{ id: 't1', name: 'T', description: '', content: '' }]}
          />,
        ),
      )

      const config = getLastUseEditorConfig()

      expect(config.content).toBe('<p>Custom content</p>')
    })

    it('THEN should default to empty string when no content or templates', async () => {
      await act(() => render(<RichTextEditor />))

      const config = getLastUseEditorConfig()

      expect(config.content).toBe('')
    })
  })
})
