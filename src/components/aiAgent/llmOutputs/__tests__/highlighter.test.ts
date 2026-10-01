import { HighlighterCore } from 'shiki/core'

const mockCreateHighlighter = jest.fn()
const mockLoadLanguage = jest.fn()
const mockJavascriptGrammar = jest.fn()
const mockGoGrammar = jest.fn()
const mockFullBundleImported = jest.fn()
const highlighter = {
  loadLanguage: mockLoadLanguage,
  getLoadedLanguages: () => [],
} as unknown as HighlighterCore

jest.mock('shiki/bundle/web', () => ({
  createHighlighter: (...args: unknown[]) => mockCreateHighlighter(...args),
  bundledLanguages: { javascript: mockJavascriptGrammar, js: mockJavascriptGrammar },
}))

jest.mock('shiki/bundle/full', () => {
  mockFullBundleImported()
  return { bundledLanguages: { go: mockGoGrammar } }
})

jest.mock('shiki/themes/catppuccin-latte.mjs', () => ({}), { virtual: true })

describe('AI code highlighter', () => {
  let resource: typeof import('../highlighter')

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockCreateHighlighter.mockResolvedValue(highlighter)
    mockLoadLanguage.mockResolvedValue(undefined)
    resource = jest.requireActual('../highlighter')
  })

  it('does not initialize on import, and shares one initialization without eager grammars', async () => {
    expect(mockCreateHighlighter).not.toHaveBeenCalled()

    const first = resource.getHighlighter()
    const second = resource.getHighlighter()

    expect(first).toBe(second)
    await expect(first).resolves.toBe(highlighter)
    expect(mockCreateHighlighter).toHaveBeenCalledTimes(1)
    expect(mockCreateHighlighter).toHaveBeenCalledWith({ langs: [], themes: [{}] })
  })

  it('retries initialization after rejection', async () => {
    mockCreateHighlighter.mockRejectedValueOnce(new Error('initialization failed'))

    await expect(resource.getHighlighter()).rejects.toThrow('initialization failed')
    await expect(resource.getHighlighter()).resolves.toBe(highlighter)
    expect(mockCreateHighlighter).toHaveBeenCalledTimes(2)
  })

  it('shares a grammar load across concurrent blocks and resolves every waiter', async () => {
    let resolveGrammar: () => void = () => undefined

    mockLoadLanguage.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveGrammar = resolve
      }),
    )
    const first = resource.ensureLanguage(highlighter, 'javascript')
    const second = resource.ensureLanguage(highlighter, 'javascript')

    expect(first).toBe(second)
    expect(mockLoadLanguage).toHaveBeenCalledTimes(1)
    resolveGrammar()
    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
    expect(mockFullBundleImported).not.toHaveBeenCalled()
  })

  it('uses the full bundle only for a grammar absent from the web bundle', async () => {
    await expect(resource.ensureLanguage(highlighter, 'go')).resolves.toBe(true)
    expect(mockFullBundleImported).toHaveBeenCalledTimes(1)
    expect(mockLoadLanguage).toHaveBeenCalledWith(mockGoGrammar)
  })

  it('retries a rejected grammar without reinitializing the highlighter', async () => {
    await resource.getHighlighter()
    mockLoadLanguage.mockRejectedValueOnce(new Error('grammar failed'))

    await expect(resource.ensureLanguage(highlighter, 'js')).rejects.toThrow('grammar failed')
    await expect(resource.ensureLanguage(highlighter, 'js')).resolves.toBe(true)
    expect(mockLoadLanguage).toHaveBeenCalledTimes(2)
    expect(mockCreateHighlighter).toHaveBeenCalledTimes(1)
  })

  it.each(['unknown-language', 'constructor'])(
    'treats %s as unknown without loading a grammar',
    async (language) => {
      await expect(resource.ensureLanguage(highlighter, language)).resolves.toBe(false)
      expect(mockLoadLanguage).not.toHaveBeenCalled()
    },
  )

  it.each(['text', 'plaintext', 'txt', 'ansi'])(
    'does not load a grammar for %s',
    async (language) => {
      await expect(resource.ensureLanguage(highlighter, language)).resolves.toBe(true)
      expect(mockLoadLanguage).not.toHaveBeenCalled()
      expect(mockFullBundleImported).not.toHaveBeenCalled()
    },
  )
})
