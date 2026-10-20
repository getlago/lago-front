import { render } from '@testing-library/react'
import Prism from 'prismjs'

import { CodeSnippet } from '../CodeSnippet'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

describe('CodeSnippet', () => {
  const style = document.createElement('style')

  beforeAll(() => {
    const { readFileSync } = jest.requireActual<typeof import('node:fs')>('node:fs')

    style.textContent = readFileSync(`${__dirname}/../codeSnippet.css`, 'utf8')
    document.head.appendChild(style)
  })

  afterAll(() => style.remove())
  afterEach(() => jest.restoreAllMocks())

  it('highlights mounted code and updates the grammar and line numbers when inputs change', () => {
    const highlight = jest.spyOn(Prism, 'highlightElement')
    const { container, rerender } = render(<CodeSnippet loading code="const value = 1" />)

    expect(highlight).not.toHaveBeenCalled()

    rerender(<CodeSnippet loading={false} code={'const value = 1\nconst other = 2'} />)

    expect(highlight).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.token.keyword')).toHaveTextContent('const')
    expect(container.querySelectorAll('.line-numbers-rows > span')).toHaveLength(2)

    rerender(<CodeSnippet loading={false} code={'{"value": true}'} language="json" />)

    expect(highlight).toHaveBeenCalledTimes(2)
    expect(container.querySelector('.token.property')).toHaveTextContent('"value"')
    expect(container.querySelectorAll('.line-numbers-rows > span')).toHaveLength(1)

    rerender(<CodeSnippet loading code={'{"value": true}'} language="json" />)
    rerender(<CodeSnippet loading={false} code={'{"value": true}'} language="json" />)

    expect(highlight).toHaveBeenCalledTimes(3)
    expect(container.querySelectorAll('.line-numbers-rows > span')).toHaveLength(1)
  })

  it.each([
    { displayHead: false },
    { variant: 'minimal' as const },
    { className: 'w-80' },
    { canCopy: false },
  ])(
    'preserves scrolling and line-number layout without re-highlighting for %j',
    (presentationProps) => {
      const highlight = jest.spyOn(Prism, 'highlightElement')
      const resize = jest.spyOn(Prism.plugins.lineNumbers, 'resize')
      const code = 'const a = 1\nconst b = 2'
      const { container, rerender } = render(<CodeSnippet code={code} />)
      const pre = container.querySelector('pre') as HTMLPreElement
      const rows = container.querySelector('.line-numbers-rows')
      const keyword = container.querySelector('.token.keyword')

      expect(pre).toHaveClass('language-javascript', 'line-numbers')
      expect(getComputedStyle(pre).overflow).toBe('auto')
      expect(keyword).toHaveTextContent('const')
      expect(rows?.children).toHaveLength(2)

      highlight.mockClear()
      resize.mockClear()
      rerender(<CodeSnippet code={code} {...presentationProps} />)

      expect(getComputedStyle(pre).overflow).toBe('auto')
      expect(pre).toHaveClass('language-javascript', 'line-numbers')
      expect(highlight).not.toHaveBeenCalled()
      expect(resize).toHaveBeenCalledWith(pre)
      expect(container.querySelector('.token.keyword')).toBe(keyword)
      expect(container.querySelector('.line-numbers-rows')).toBe(rows)
      expect(rows?.children).toHaveLength(2)

      rerender(<CodeSnippet code={code} />)

      expect(getComputedStyle(pre).overflow).toBe('auto')
      expect(pre).toHaveClass('language-javascript', 'line-numbers')
      expect(highlight).not.toHaveBeenCalled()
      expect(container.querySelector('.token.keyword')).toBe(keyword)
      expect(container.querySelector('.line-numbers-rows')).toBe(rows)
      expect(rows?.children).toHaveLength(2)
    },
  )

  it('re-highlights unchanged code when only the language changes', () => {
    const highlight = jest.spyOn(Prism, 'highlightElement')
    const { rerender, container } = render(<CodeSnippet code="true" language="javascript" />)

    rerender(<CodeSnippet code="true" language="json" />)

    const pre = container.querySelector('pre') as HTMLPreElement

    expect(highlight).toHaveBeenCalledTimes(2)
    expect(pre).toHaveClass('language-json', 'line-numbers')
    expect(pre).not.toHaveClass('language-javascript')
    expect(getComputedStyle(pre).overflow).toBe('auto')
    expect(container.querySelector('code')).toHaveClass('language-json')
    expect(container.querySelector('.token.boolean')).toHaveTextContent('true')
  })
})
