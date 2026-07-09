import { configure, render, screen } from '@testing-library/react'

import { PaginatedContent } from '~/components/designSystem/Pagination/PaginatedContent'

configure({ testIdAttribute: 'data-test' })

const mockPaginationSpy = jest.fn()

jest.mock('~/components/designSystem/Pagination/Pagination', () => ({
  Pagination: (props: Record<string, unknown>) => {
    mockPaginationSpy(props)
    return <div data-test="pagination-stub" className={props.className as string} />
  },
}))

describe('PaginatedContent', () => {
  const onPageChange = jest.fn()

  beforeEach(() => {
    mockPaginationSpy.mockClear()
    onPageChange.mockClear()
  })

  it('renders the children next to the pager', () => {
    render(
      <PaginatedContent onPageChange={onPageChange}>
        <span data-test="list-content">rows</span>
      </PaginatedContent>,
    )

    expect(screen.getByTestId('list-content')).toBeInTheDocument()
    expect(screen.getByTestId('pagination-stub')).toBeInTheDocument()
  })

  it('forwards metadata fields to Pagination', () => {
    render(
      <PaginatedContent
        onPageChange={onPageChange}
        metadata={{ currentPage: 3, totalPages: 7, totalCount: 130 }}
      >
        <div />
      </PaginatedContent>,
    )

    expect(mockPaginationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPage: 3,
        totalPages: 7,
        totalCount: 130,
      }),
    )
  })

  it('falls back to currentPage=1, totalPages=0, totalCount=0 when metadata is undefined', () => {
    render(
      <PaginatedContent onPageChange={onPageChange}>
        <div />
      </PaginatedContent>,
    )

    expect(mockPaginationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
      }),
    )
  })

  it('falls back to currentPage=1, totalPages=0, totalCount=0 when metadata is null', () => {
    render(
      <PaginatedContent onPageChange={onPageChange} metadata={null}>
        <div />
      </PaginatedContent>,
    )

    expect(mockPaginationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
      }),
    )
  })

  it('clamps an out-of-range page to the last page when data exists', () => {
    render(
      <PaginatedContent
        onPageChange={onPageChange}
        metadata={{ currentPage: 200000, totalPages: 3, totalCount: 45 }}
      >
        <div />
      </PaginatedContent>,
    )

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('does not clamp when the current page is in range', () => {
    render(
      <PaginatedContent
        onPageChange={onPageChange}
        metadata={{ currentPage: 2, totalPages: 3, totalCount: 45 }}
      >
        <div />
      </PaginatedContent>,
    )

    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('does not clamp a genuinely empty list (keeps its empty state)', () => {
    render(
      <PaginatedContent
        onPageChange={onPageChange}
        metadata={{ currentPage: 200000, totalPages: 0, totalCount: 0 }}
      >
        <div />
      </PaginatedContent>,
    )

    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('does not clamp while loading (metadata may be stale mid-fetch)', () => {
    render(
      <PaginatedContent
        onPageChange={onPageChange}
        loading
        metadata={{ currentPage: 200000, totalPages: 3, totalCount: 45 }}
      >
        <div />
      </PaginatedContent>,
    )

    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('forwards pageSize, onPageSizeChange, pageSizeOptions and loading', () => {
    const onPageSizeChange = jest.fn()

    render(
      <PaginatedContent
        onPageChange={onPageChange}
        pageSize={50}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[20, 50, 100]}
        loading
      >
        <div />
      </PaginatedContent>,
    )

    expect(mockPaginationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 50,
        onPageSizeChange,
        pageSizeOptions: [20, 50, 100],
        loading: true,
      }),
    )
  })

  it('wraps onPageChange (to scroll the list to the top) but delegates to the provided handler', () => {
    render(
      <PaginatedContent onPageChange={onPageChange}>
        <div />
      </PaginatedContent>,
    )

    const { onPageChange: forwardedOnPageChange } = mockPaginationSpy.mock.calls[0][0] as {
      onPageChange: (page: number) => void
    }

    // it's a wrapper, not the same function reference…
    expect(forwardedOnPageChange).not.toBe(onPageChange)

    // …but calling it forwards the requested page to the caller's handler
    forwardedOnPageChange(4)
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('also wraps and delegates onPageChange when sticky is false (nested list branch)', () => {
    render(
      <PaginatedContent onPageChange={onPageChange} sticky={false}>
        <div />
      </PaginatedContent>,
    )

    const { onPageChange: forwardedOnPageChange } = mockPaginationSpy.mock.calls[0][0] as {
      onPageChange: (page: number) => void
    }

    expect(forwardedOnPageChange).not.toBe(onPageChange)

    forwardedOnPageChange(2)
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('renders children + pager as siblings (no wrapper div) by default (sticky)', () => {
    const { container } = render(
      <PaginatedContent onPageChange={onPageChange}>
        <span data-test="list-content">rows</span>
      </PaginatedContent>,
    )

    expect(container.children).toHaveLength(2)
    expect(container.firstElementChild).toBe(screen.getByTestId('list-content'))
  })

  it('gives the pager the sticky positioning classes by default', () => {
    render(
      <PaginatedContent onPageChange={onPageChange}>
        <div />
      </PaginatedContent>,
    )

    const [[{ className }]] = mockPaginationSpy.mock.calls

    expect(className).toContain('sticky')
    expect(className).toContain('bottom-0')
    expect(className).toContain('mt-auto')
  })

  it('does not indent the pager with the page gutter by default', () => {
    render(
      <PaginatedContent onPageChange={onPageChange}>
        <div />
      </PaginatedContent>,
    )

    const [[{ className }]] = mockPaginationSpy.mock.calls

    // padded containers (settings, customer detail) provide the gutter — the pager must not double it
    expect(className).not.toContain('md:px-12')
  })

  it('indents the pager with the page gutter when insetPager is set (full-page lists)', () => {
    render(
      <PaginatedContent onPageChange={onPageChange} insetPager>
        <div />
      </PaginatedContent>,
    )

    const [[{ className }]] = mockPaginationSpy.mock.calls

    expect(className).toContain('px-4')
    expect(className).toContain('md:px-12')
  })

  it('ignores insetPager when not sticky (nested lists already sit in a padded wrapper)', () => {
    render(
      <PaginatedContent onPageChange={onPageChange} insetPager sticky={false}>
        <div />
      </PaginatedContent>,
    )

    const [[{ className }]] = mockPaginationSpy.mock.calls

    expect(className).not.toContain('md:px-12')
  })

  it('wraps children + pager in a single <div> when sticky is false', () => {
    const { container } = render(
      <PaginatedContent onPageChange={onPageChange} sticky={false}>
        <span data-test="list-content">rows</span>
      </PaginatedContent>,
    )

    const wrapper = container.firstElementChild as HTMLElement

    expect(wrapper.tagName).toBe('DIV')
    expect(wrapper.children).toHaveLength(2)
    expect(container.children).toHaveLength(1)
  })

  it('gives the pager the overlap-margin class (no sticky) when sticky is false', () => {
    render(
      <PaginatedContent onPageChange={onPageChange} sticky={false}>
        <div />
      </PaginatedContent>,
    )

    const [[{ className }]] = mockPaginationSpy.mock.calls

    expect(className).toContain('-mt-px')
    expect(className).not.toContain('sticky')
  })
})
