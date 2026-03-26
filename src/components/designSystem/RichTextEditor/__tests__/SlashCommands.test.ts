import { slashCommandDefinitions, SlashCommands } from '../extensions/SlashCommands'

const mockDestroyPopup = jest.fn()
const mockHidePopup = jest.fn()
const mockSetProps = jest.fn()
const mockDestroyRenderer = jest.fn()
const mockUpdateProps = jest.fn()
const mockRendererElement = document.createElement('div')

jest.mock('tippy.js', () => ({
  __esModule: true,
  default: jest
    .fn()
    .mockImplementation(() => [
      { destroy: mockDestroyPopup, hide: mockHidePopup, setProps: mockSetProps },
    ]),
}))

jest.mock('@tiptap/react', () => ({
  ReactRenderer: jest.fn().mockImplementation(() => ({
    element: mockRendererElement,
    destroy: mockDestroyRenderer,
    updateProps: mockUpdateProps,
    ref: null,
  })),
}))

const mockTranslate = (key: string): string => {
  const translations: Record<string, string> = {
    text_1774281559656dn2u208gh80: 'Heading 1',
    text_1774281559656pla0xamsvmf: 'Large section heading',
    text_1774281559657ec0exeaqqd3: 'Heading 2',
    text_1774281559657q7h8pu6455p: 'Medium section heading',
    text_1774281559657t0kkn628zdy: 'Heading 3',
    text_1774281559657o48ilt0rq5y: 'Small section heading',
    text_1774281559657cbz20fzcjka: 'Bullet List',
    text_17742815596575m8mqwrg1qy: 'Unordered list',
    text_1774281559657yc3z031hm6x: 'Table',
    text_1774281559657y9saycc2aev: 'Insert a 3x3 table',
    text_1774281559657l4kkx9ws4mz: 'Code Block',
    text_1774281559657qdknwsvn5ka: 'Insert a code block',
  }

  return translations[key] ?? key
}

const resolveItems = () =>
  slashCommandDefinitions.map((def) => ({
    title: mockTranslate(def.titleKey),
    description: mockTranslate(def.descriptionKey),
    command: def.command,
  }))

describe('SlashCommands', () => {
  describe('slashCommandDefinitions', () => {
    describe('GIVEN the slash command definitions are defined', () => {
      it('THEN should contain all expected translation keys', () => {
        const titleKeys = slashCommandDefinitions.map((def) => def.titleKey)

        expect(titleKeys).toEqual([
          'text_1774281559656dn2u208gh80',
          'text_1774281559657ec0exeaqqd3',
          'text_1774281559657t0kkn628zdy',
          'text_1774281559657cbz20fzcjka',
          'text_1774281559657yc3z031hm6x',
          'text_1774281559657l4kkx9ws4mz',
        ])
      })

      it.each(slashCommandDefinitions)(
        'THEN each definition should have a descriptionKey and command',
        (def) => {
          expect(def.descriptionKey).toBeTruthy()
          expect(typeof def.command).toBe('function')
        },
      )
    })

    describe('GIVEN the suggestion config', () => {
      describe('WHEN filtering resolved items with a query', () => {
        const filterItems = (query: string) => {
          const items = resolveItems()

          return items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
        }

        it('THEN should return all items for empty query', () => {
          expect(filterItems('')).toHaveLength(6)
        })

        it('THEN should filter items by title case-insensitively', () => {
          const results = filterItems('head')

          expect(results).toHaveLength(3)
          expect(results.map((r) => r.title)).toEqual(['Heading 1', 'Heading 2', 'Heading 3'])
        })

        it('THEN should return empty array for non-matching query', () => {
          expect(filterItems('nonexistent')).toHaveLength(0)
        })

        it('THEN should find table command', () => {
          const results = filterItems('table')

          expect(results).toHaveLength(1)
          expect(results[0].title).toBe('Table')
        })
      })
    })

    describe('GIVEN a command is executed', () => {
      const createMockEditor = () => {
        const runMock = jest.fn()
        const chainMethods: Record<string, jest.Mock> = {}

        const handler: ProxyHandler<Record<string, jest.Mock>> = {
          get: (_target, prop: string) => {
            if (prop === 'run') return runMock
            if (!chainMethods[prop]) {
              chainMethods[prop] = jest.fn().mockReturnValue(new Proxy({}, handler))
            }

            return chainMethods[prop]
          },
        }

        return {
          chain: jest.fn().mockReturnValue(new Proxy({}, handler)),
          runMock,
        }
      }

      it.each([
        ['Heading 1', 0],
        ['Heading 2', 1],
        ['Heading 3', 2],
        ['Bullet List', 3],
        ['Table', 4],
        ['Code Block', 5],
      ])('WHEN "%s" command is called THEN should invoke editor chain', (_, index) => {
        const mockEditor = createMockEditor()

        slashCommandDefinitions[index].command(
          mockEditor as unknown as Parameters<
            (typeof slashCommandDefinitions)[number]['command']
          >[0],
        )

        expect(mockEditor.chain).toHaveBeenCalled()
        expect(mockEditor.runMock).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the suggestion render lifecycle', () => {
    const tippy = jest.requireMock('tippy.js').default as jest.Mock

    const getRenderCallbacks = () => {
      const options = (
        SlashCommands.config.addOptions as unknown as () => {
          suggestion: {
            render: () => {
              onStart: (props: Record<string, unknown>) => void
              onUpdate: (props: Record<string, unknown>) => void
              onKeyDown: (props: { event: { key: string } }) => boolean
              onExit: () => void
            }
          }
        }
      )()

      return options.suggestion.render()
    }

    const createSuggestionProps = (
      clientRect?: (() => DOMRect) | null,
    ): Record<string, unknown> => ({
      editor: {},
      clientRect,
    })

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('WHEN onStart is called with a valid clientRect', () => {
      it('THEN should pass the clientRect result to tippy', () => {
        const callbacks = getRenderCallbacks()
        const rect = new DOMRect(10, 20, 100, 50)
        const props = createSuggestionProps(() => rect)

        callbacks.onStart(props)

        const tippyCall = tippy.mock.calls[0]
        const getReferenceClientRect = tippyCall[1].getReferenceClientRect as () => DOMRect

        expect(getReferenceClientRect()).toEqual(rect)
      })
    })

    describe('WHEN onStart is called with null clientRect', () => {
      it('THEN should fall back to an empty DOMRect', () => {
        const callbacks = getRenderCallbacks()
        const props = createSuggestionProps(null)

        callbacks.onStart(props)

        const tippyCall = tippy.mock.calls[0]
        const getReferenceClientRect = tippyCall[1].getReferenceClientRect as () => DOMRect
        const result = getReferenceClientRect()

        expect(result).toBeInstanceOf(DOMRect)
        expect(result.x).toBe(0)
        expect(result.y).toBe(0)
        expect(result.width).toBe(0)
        expect(result.height).toBe(0)
      })
    })

    describe('WHEN onStart is called with undefined clientRect', () => {
      it('THEN should fall back to an empty DOMRect', () => {
        const callbacks = getRenderCallbacks()
        const props = createSuggestionProps(undefined)

        callbacks.onStart(props)

        const tippyCall = tippy.mock.calls[0]
        const getReferenceClientRect = tippyCall[1].getReferenceClientRect as () => DOMRect
        const result = getReferenceClientRect()

        expect(result).toBeInstanceOf(DOMRect)
        expect(result.width).toBe(0)
      })
    })

    describe('WHEN onUpdate is called with null clientRect', () => {
      it('THEN should pass a fallback DOMRect to setProps', () => {
        const callbacks = getRenderCallbacks()

        // onStart must be called first to initialize renderer/popup
        callbacks.onStart(createSuggestionProps(() => new DOMRect()))

        callbacks.onUpdate(createSuggestionProps(null))

        const setPropsCall = mockSetProps.mock.calls[0]
        const getReferenceClientRect = setPropsCall[0].getReferenceClientRect as () => DOMRect
        const result = getReferenceClientRect()

        expect(result).toBeInstanceOf(DOMRect)
        expect(result.width).toBe(0)
      })
    })

    describe('WHEN onExit is called', () => {
      it('THEN should destroy popup and renderer', () => {
        const callbacks = getRenderCallbacks()

        callbacks.onStart(createSuggestionProps(() => new DOMRect()))
        callbacks.onExit()

        expect(mockDestroyPopup).toHaveBeenCalled()
        expect(mockDestroyRenderer).toHaveBeenCalled()
      })
    })

    describe('WHEN onKeyDown is called with Escape', () => {
      it('THEN should hide the popup and return true', () => {
        const callbacks = getRenderCallbacks()

        callbacks.onStart(createSuggestionProps(() => new DOMRect()))

        const result = callbacks.onKeyDown({ event: { key: 'Escape' } })

        expect(mockHidePopup).toHaveBeenCalled()
        expect(result).toBe(true)
      })
    })

    describe('WHEN onKeyDown is called with a non-Escape key', () => {
      it('THEN should return false when ref is null', () => {
        const callbacks = getRenderCallbacks()

        callbacks.onStart(createSuggestionProps(() => new DOMRect()))

        const result = callbacks.onKeyDown({ event: { key: 'Enter' } })

        expect(mockHidePopup).not.toHaveBeenCalled()
        expect(result).toBe(false)
      })
    })
  })
})
