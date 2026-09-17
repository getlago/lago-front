import { fireEvent, render, screen, within } from '@testing-library/react'

import { Pagination } from '~/components/designSystem/Pagination/Pagination'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, args?: Record<string, unknown>) => {
      if (key === 'text_1782992964028u0dbq1gbcy4') {
        return `${args?.startNumber}-${args?.endNumber} of ${args?.count} results`
      }
      if (key === 'text_1786997491915x333f5g35ff') {
        return `${args?.startNumber}-${args?.endNumber} of ${args?.count}+ results`
      }
      if (key === 'text_1782992964029cazjloaotl0') {
        return `${args?.count} rows per page`
      }
      return key
    },
  }),
}))

describe('Pagination', () => {
  const baseProps = {
    currentPage: 1,
    totalPages: 3,
    totalCount: 45,
    pageSize: 20,
    onPageChange: jest.fn(),
  }

  beforeEach(() => jest.clearAllMocks())

  it('renders nothing when there are no pages', () => {
    const { container } = render(
      <Pagination {...baseProps} totalPages={0} onPageChange={jest.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the "start-end of total results" range label', () => {
    render(<Pagination {...baseProps} currentPage={2} />)

    expect(screen.getByText('21-40 of 45 results')).toBeInTheDocument()
  })

  it('clamps the end of the range to the total count on the last page', () => {
    render(<Pagination {...baseProps} currentPage={3} />)

    expect(screen.getByText('41-45 of 45 results')).toBeInTheDocument()
  })

  it('calls onPageChange when prev / next are clicked', () => {
    const onPageChange = jest.fn()

    render(<Pagination {...baseProps} currentPage={2} onPageChange={onPageChange} />)

    const [prev, next] = within(
      screen.getByRole('navigation', { name: 'pagination' }),
    ).getAllByRole('button')

    fireEvent.click(prev)
    expect(onPageChange).toHaveBeenCalledWith(1)

    fireEvent.click(next)
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('disables prev on the first page and next on the last page', () => {
    const { rerender } = render(<Pagination {...baseProps} currentPage={1} />)
    let buttons = within(screen.getByRole('navigation', { name: 'pagination' })).getAllByRole(
      'button',
    )

    expect(buttons[0]).toBeDisabled() // prev
    expect(buttons[1]).not.toBeDisabled() // next

    rerender(<Pagination {...baseProps} currentPage={3} />)
    buttons = within(screen.getByRole('navigation', { name: 'pagination' })).getAllByRole('button')

    expect(buttons[0]).not.toBeDisabled() // prev
    expect(buttons[1]).toBeDisabled() // next
  })

  it('does not render the rows-per-page menu when onPageSizeChange is absent', () => {
    render(<Pagination {...baseProps} />)

    // only prev + next, no results-label button
    expect(
      within(screen.getByRole('navigation', { name: 'pagination' })).getAllByRole('button'),
    ).toHaveLength(2)
  })

  it('opens the rows-per-page menu and switches the page size', () => {
    const onPageSizeChange = jest.fn()

    render(
      <Pagination
        {...baseProps}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[20, 50, 1000]}
      />,
    )

    // the range label is the menu trigger
    fireEvent.click(screen.getByText('1-20 of 45 results'))

    fireEvent.click(screen.getByText('50 rows per page'))

    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })

  it('stays visible with a skeleton label and disabled arrows while loading', () => {
    render(<Pagination {...baseProps} currentPage={2} loading />)

    const nav = screen.getByRole('navigation', { name: 'pagination' })

    // range label replaced by a skeleton
    expect(screen.queryByText('21-40 of 45 results')).not.toBeInTheDocument()
    expect(nav.querySelector('.animate-pulse')).toBeInTheDocument()

    // prev + next disabled
    within(nav)
      .getAllByRole('button')
      .forEach((button) => expect(button).toBeDisabled())
  })

  it('stays visible while loading even with a single page', () => {
    render(<Pagination {...baseProps} totalPages={1} loading />)

    expect(screen.getByRole('navigation', { name: 'pagination' })).toBeInTheDocument()
  })

  it('renders nothing on a single page when there is no rows-per-page menu', () => {
    const { container } = render(<Pagination {...baseProps} totalPages={1} totalCount={12} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('keeps the footer (menu + disabled arrows) on a single page when a larger page size hides the pager', () => {
    // 35 items shown at once (pageSize 50) → one page, but the smallest option (20) would
    // repaginate, so the menu must stay reachable to switch back.
    render(
      <Pagination
        {...baseProps}
        totalPages={1}
        totalCount={35}
        pageSize={50}
        onPageSizeChange={jest.fn()}
        pageSizeOptions={[20, 50, 100]}
      />,
    )

    const nav = screen.getByRole('navigation', { name: 'pagination' })
    const [prev, next] = within(nav).getAllByRole('button')

    // the results/size-menu label is present…
    expect(screen.getByText('1-35 of 35 results')).toBeInTheDocument()
    // …and the prev/next arrows stay rendered but disabled (single page)
    expect(prev).toBeDisabled()
    expect(next).toBeDisabled()
  })

  it('hides the footer with a menu when even the smallest option shows everything', () => {
    const { container } = render(
      <Pagination
        {...baseProps}
        totalPages={1}
        totalCount={15}
        pageSize={20}
        onPageSizeChange={jest.fn()}
        pageSizeOptions={[20, 50, 100]}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  // Capped total (invoice list): `totalCount` is a 10,000 floor and `totalPages` its 500-page
  // counterpart, so the collection's own `hasNextPage` decides whether next is reachable.
  const cappedProps = {
    ...baseProps,
    currentPage: 600,
    totalPages: 500,
    totalCount: 10000,
    pageSize: 20,
    hasNextPage: true,
    totalCountCapped: true,
  }

  it('keeps next enabled past the last counted page when hasNextPage is true', () => {
    const onPageChange = jest.fn()

    render(<Pagination {...cappedProps} onPageChange={onPageChange} />)

    const [, next] = within(screen.getByRole('navigation', { name: 'pagination' })).getAllByRole(
      'button',
    )

    expect(next).not.toBeDisabled()

    fireEvent.click(next)
    expect(onPageChange).toHaveBeenCalledWith(601)
  })

  it('disables next when hasNextPage is false, even with pages left to count', () => {
    render(<Pagination {...baseProps} currentPage={1} totalPages={3} hasNextPage={false} />)

    const [, next] = within(screen.getByRole('navigation', { name: 'pagination' })).getAllByRole(
      'button',
    )

    expect(next).toBeDisabled()
  })

  it.each([
    ['enabled in the middle of the collection', 2, false],
    ['disabled on the last page', 3, true],
  ])(
    'derives next from the page arithmetic when hasNextPage is absent (%s)',
    (_, currentPage, expectedDisabled) => {
      render(<Pagination {...baseProps} currentPage={currentPage} />)

      const [, next] = within(screen.getByRole('navigation', { name: 'pagination' })).getAllByRole(
        'button',
      )

      expect(next).toHaveProperty('disabled', expectedDisabled)
    },
  )

  it('renders the range label with a formatted floor when the total is capped', () => {
    render(<Pagination {...cappedProps} currentPage={1} />)

    expect(screen.getByText('1-20 of 10,000+ results')).toBeInTheDocument()
  })

  it('does not clamp the range to the capped total on a page past it', () => {
    render(<Pagination {...cappedProps} />)

    expect(screen.getByText('11981-12000 of 10,000+ results')).toBeInTheDocument()
  })

  it('keeps the range readable on the last page of a capped list', () => {
    // no next page, yet already past the counted range: clamping would invert the range
    render(<Pagination {...cappedProps} currentPage={603} hasNextPage={false} />)

    expect(screen.getByText('12041-12060 of 10,000+ results')).toBeInTheDocument()
  })

  it('keeps the exact-total label when the total is not capped', () => {
    render(<Pagination {...baseProps} currentPage={2} hasNextPage totalCountCapped={false} />)

    expect(screen.getByText('21-40 of 45 results')).toBeInTheDocument()
  })
})
