import { act, render, screen, waitFor } from '@testing-library/react'
import { HighlighterCore } from 'shiki/core'

import { createBlockMatch } from './fixtures'

import { Codeblock } from '../Codeblock'

const mockGetHighlighter = jest.fn()
const mockEnsureLanguage = jest.fn()
const mockCodeToHtml = jest.fn()
const highlighter: Pick<HighlighterCore, 'codeToHtml'> = { codeToHtml: mockCodeToHtml }

jest.mock('../highlighter', () => ({
  getHighlighter: () => mockGetHighlighter(),
  ensureLanguage: (...args: unknown[]) => mockEnsureLanguage(...args),
}))

jest.mock('@llm-ui/code', () => ({
  parseCompleteMarkdownCodeBlock: (output: string) => {
    const [fence, ...lines] = output.split('\n')

    return { language: fence.slice(3) || undefined, code: lines.slice(0, -1).join('\n') }
  },
}))

const renderCodeblock = (output: string): ReturnType<typeof render> =>
  render(<Codeblock blockMatch={createBlockMatch(output)} />)

describe('Codeblock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHighlighter.mockResolvedValue(highlighter)
    mockEnsureLanguage.mockResolvedValue(true)
    mockCodeToHtml.mockImplementation(
      (code: string, { lang }: { lang: string }) =>
        `<pre class="shiki"><code class="language-${lang}">${code}</code></pre>`,
    )
  })

  it('shows plaintext during initialization and highlights every block sharing a pending grammar', async () => {
    let resolveGrammar: (loaded: boolean) => void = () => undefined
    const grammar = new Promise<boolean>((resolve) => {
      resolveGrammar = resolve
    })

    mockEnsureLanguage.mockReturnValue(grammar)
    const { container } = render(
      <>
        <Codeblock blockMatch={createBlockMatch('```go\npackage first\n```')} />
        <Codeblock blockMatch={createBlockMatch('```go\npackage second\n```')} />
      </>,
    )

    expect(screen.getByText('package first')).toBeInTheDocument()
    expect(screen.getByText('package second')).toBeInTheDocument()
    expect(mockCodeToHtml).not.toHaveBeenCalled()

    await act(async () => resolveGrammar(true))

    expect(container.querySelectorAll('code.language-go')).toHaveLength(2)
  })

  it('falls back to text for an unknown language', async () => {
    mockEnsureLanguage.mockResolvedValue(false)
    const { container } = renderCodeblock('```unknown-language\nplain text\n```')

    await waitFor(() => expect(container.querySelector('code.language-text')).toBeInTheDocument())
    expect(screen.getByText('plain text')).toBeInTheDocument()
  })

  it('uses text when the code block has no language', async () => {
    renderCodeblock('```\nsome code\n```')

    await waitFor(() =>
      expect(mockCodeToHtml).toHaveBeenCalledWith(
        'some code',
        expect.objectContaining({ lang: 'text' }),
      ),
    )
  })

  it.each(['initialization', 'grammar'])(
    'retries a failed %s on the next render',
    async (failure) => {
      const failingLoad = failure === 'initialization' ? mockGetHighlighter : mockEnsureLanguage

      failingLoad.mockRejectedValueOnce(new Error('network unavailable'))
      const output = '```ruby\nputs "hello"\n```'
      const { rerender, container } = renderCodeblock(output)

      await act(async () => undefined)
      expect(screen.getByText('puts "hello"')).toBeInTheDocument()
      expect(mockCodeToHtml).not.toHaveBeenCalled()

      rerender(<Codeblock blockMatch={createBlockMatch(output)} />)

      await waitFor(() => expect(container.querySelector('code.language-ruby')).toBeInTheDocument())
      expect(failingLoad).toHaveBeenCalledTimes(2)
    },
  )

  it('ignores a stale grammar completion after the language changes', async () => {
    let resolveOldGrammar: (loaded: boolean) => void = () => undefined

    mockEnsureLanguage.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        resolveOldGrammar = resolve
      }),
    )
    const { rerender, container } = renderCodeblock('```go\nold code\n```')

    await act(async () => undefined)
    rerender(<Codeblock blockMatch={createBlockMatch('```ruby\nnew code\n```')} />)
    await waitFor(() => expect(container.querySelector('code.language-ruby')).toBeInTheDocument())
    await act(async () => resolveOldGrammar(true))

    expect(container.querySelector('code.language-ruby')).toHaveTextContent('new code')
    expect(container.querySelector('code.language-go')).not.toBeInTheDocument()
  })

  it('does not render a pending highlighter after unmount', async () => {
    let resolveHighlighter: (value: typeof highlighter) => void = () => undefined

    mockGetHighlighter.mockReturnValue(
      new Promise((resolve) => {
        resolveHighlighter = resolve
      }),
    )
    const { unmount } = renderCodeblock('```go\npackage main\n```')

    unmount()
    await act(async () => resolveHighlighter(highlighter))

    expect(mockEnsureLanguage).not.toHaveBeenCalled()
    expect(mockCodeToHtml).not.toHaveBeenCalled()
  })

  it('keeps code readable if the highlighter throws during rendering', async () => {
    mockCodeToHtml.mockImplementation(() => {
      throw new Error('invalid grammar')
    })
    renderCodeblock('```go\npackage main\n```')

    await waitFor(() => expect(mockCodeToHtml).toHaveBeenCalled())
    expect(screen.getByText('package main')).toBeInTheDocument()
  })
})
