import { fireEvent, render, screen, within } from '@testing-library/react'

import { Pagination } from '~/components/designSystem/Pagination'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, args?: Record<string, unknown>) => {
      if (key === 'text_1782992964028u0dbq1gbcy4') {
        return `${args?.startNumber}-${args?.endNumber} of ${args?.count} results`
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
})
