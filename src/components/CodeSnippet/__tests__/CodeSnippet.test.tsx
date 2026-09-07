import { render } from '@testing-library/react'
import Prism from 'prismjs'

import { CodeSnippet } from '../CodeSnippet'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

describe('CodeSnippet', () => {
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

  it('refreshes line-number layout without re-highlighting on presentation changes', () => {
    const highlight = jest.spyOn(Prism, 'highlightElement')
    const resize = jest.spyOn(Prism.plugins.lineNumbers, 'resize')
    const { container, rerender } = render(<CodeSnippet code={'const a = 1\nconst b = 2'} />)
    const rows = container.querySelector('.line-numbers-rows')

    highlight.mockClear()
    resize.mockClear()
    rerender(
      <CodeSnippet
        code={'const a = 1\nconst b = 2'}
        variant="minimal"
        className="w-80"
        displayHead={false}
        canCopy={false}
      />,
    )

    expect(highlight).not.toHaveBeenCalled()
    expect(resize).toHaveBeenCalledWith(container.querySelector('pre'))
    expect(container.querySelector('.line-numbers-rows')).toBe(rows)
    expect(container.querySelectorAll('.line-numbers-rows > span')).toHaveLength(2)
  })

  it('re-highlights unchanged code when only the language changes', () => {
    const highlight = jest.spyOn(Prism, 'highlightElement')
    const { rerender, container } = render(<CodeSnippet code="true" language="javascript" />)

    rerender(<CodeSnippet code="true" language="json" />)

    expect(highlight).toHaveBeenCalledTimes(2)
    expect(container.querySelector('code')).toHaveClass('language-json')
    expect(container.querySelector('.token.boolean')).toHaveTextContent('true')
  })
})
