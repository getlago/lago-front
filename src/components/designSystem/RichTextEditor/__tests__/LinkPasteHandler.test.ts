import { LinkPasteHandler } from '../extensions/LinkPasteHandler'

describe('LinkPasteHandler', () => {
  describe('GIVEN the extension is created', () => {
    it('THEN should have the name "linkPasteHandler"', () => {
      expect(LinkPasteHandler.name).toBe('linkPasteHandler')
    })
  })

  describe('GIVEN a paste event with a valid URL', () => {
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
        state: { selection: { from: 25 } },
        view: {
          coordsAtPos: jest.fn().mockReturnValue({ left: 100, top: 200, bottom: 220 }),
        },
        runMock,
        chainMethods,
      }
    }

    const createPasteEvent = (text: string) => ({
      clipboardData: {
        getData: jest.fn().mockReturnValue(text),
      },
    })

    const getHandlePaste = (mockEditor: ReturnType<typeof createMockEditor>) => {
      // Access the extension config to get addProseMirrorPlugins
      const config = LinkPasteHandler.config

      // We need to call addProseMirrorPlugins with the editor context
      const addPlugins = config.addProseMirrorPlugins as unknown as (this: {
        editor: unknown
      }) => Array<{ props: { handlePaste: (_view: unknown, event: unknown) => boolean } }>

      const plugins = addPlugins.call({ editor: mockEditor })
      const plugin = plugins[0]

      // The plugin's handlePaste is in props
      return plugin.props.handlePaste
    }

    describe('WHEN pasting a valid http URL', () => {
      it('THEN should return true (handled)', () => {
        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = createPasteEvent('https://example.com')

        const result = handlePaste(null, event)

        expect(result).toBe(true)
      })

      it('THEN should insert the URL as a link via editor chain', () => {
        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = createPasteEvent('https://example.com')

        handlePaste(null, event)

        expect(mockEditor.chain).toHaveBeenCalled()
      })
    })

    describe('WHEN pasting an http:// URL', () => {
      it('THEN should return true', () => {
        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = createPasteEvent('http://example.com/path')

        expect(handlePaste(null, event)).toBe(true)
      })
    })

    describe('WHEN pasting a URL with whitespace', () => {
      it('THEN should handle trimmed URL', () => {
        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = createPasteEvent('  https://example.com  ')

        expect(handlePaste(null, event)).toBe(true)
      })
    })

    describe('WHEN the requestAnimationFrame callback fires', () => {
      it('THEN should create a popup anchored at the link position', () => {
        const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
          cb(0)

          return 0
        })

        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = createPasteEvent('https://example.com')

        handlePaste(null, event)

        expect(mockEditor.view.coordsAtPos).toHaveBeenCalled()

        rafSpy.mockRestore()
      })
    })
  })

  describe('GIVEN a paste event with invalid or no URL', () => {
    const createMockEditor = () => ({
      chain: jest.fn(),
      state: { selection: { from: 0 } },
      view: { coordsAtPos: jest.fn() },
    })

    const getHandlePaste = (mockEditor: ReturnType<typeof createMockEditor>) => {
      const config = LinkPasteHandler.config
      const addPlugins = config.addProseMirrorPlugins as unknown as (this: {
        editor: unknown
      }) => Array<{ props: { handlePaste: (_view: unknown, event: unknown) => boolean } }>

      const plugins = addPlugins.call({ editor: mockEditor })

      return plugins[0].props.handlePaste
    }

    const createPasteEvent = (text: string | null) => ({
      clipboardData: {
        getData: jest.fn().mockReturnValue(text),
      },
    })

    describe('WHEN pasting plain text that is not a URL', () => {
      it('THEN should return false', () => {
        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = createPasteEvent('hello world')

        expect(handlePaste(null, event)).toBe(false)
      })

      it('THEN should not call editor.chain', () => {
        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = createPasteEvent('just some text')

        handlePaste(null, event)

        expect(mockEditor.chain).not.toHaveBeenCalled()
      })
    })

    describe('WHEN pasting empty text', () => {
      it('THEN should return false', () => {
        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = createPasteEvent('')

        expect(handlePaste(null, event)).toBe(false)
      })
    })

    describe('WHEN pasting a URL without protocol', () => {
      it('THEN should return false', () => {
        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = createPasteEvent('example.com')

        expect(handlePaste(null, event)).toBe(false)
      })
    })

    describe('WHEN pasting an ftp URL', () => {
      it('THEN should return false', () => {
        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = createPasteEvent('ftp://files.example.com')

        expect(handlePaste(null, event)).toBe(false)
      })
    })

    describe('WHEN clipboardData returns null', () => {
      it('THEN should return false', () => {
        const mockEditor = createMockEditor()
        const handlePaste = getHandlePaste(mockEditor)
        const event = { clipboardData: null }

        expect(handlePaste(null, event)).toBe(false)
      })
    })
  })
})
