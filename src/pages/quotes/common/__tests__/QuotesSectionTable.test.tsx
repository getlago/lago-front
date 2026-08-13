import { render } from '~/test-utils'

import { QuotesSectionTable } from '../QuotesSectionTable'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const mockTableProps: { current?: Record<string, unknown> } = {}

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps.current = props
    return null
  },
}))

const mockPaginatedContentProps: { current?: Record<string, unknown> } = {}

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: (props: {
    children: React.ReactNode
    onPageChange: (page: number) => void
  }) => {
    mockPaginatedContentProps.current = props
    return props.children
  },
}))

type Row = { id: string; number: string }

const baseProps = {
  name: 'orders-list',
  data: [{ id: '1', number: 'OF-1' }] as Row[],
  isLoading: false,
  hasError: false,
  columns: [],
  emptyState: { title: 'empty-title', subtitle: 'empty-subtitle' },
}

beforeEach(() => {
  mockTableProps.current = undefined
  mockPaginatedContentProps.current = undefined
})

describe('QuotesSectionTable', () => {
  it('passes name, containerSize and emptyState placeholder through to Table', () => {
    const fetchMore = jest.fn()

    render(
      <QuotesSectionTable<Row>
        {...baseProps}
        metadata={{ currentPage: 1, totalPages: 2, totalCount: 10 }}
        fetchMore={fetchMore}
      />,
    )

    expect(mockTableProps.current?.name).toBe('orders-list')
    expect(mockTableProps.current?.containerSize).toBe(0)
    expect(mockTableProps.current?.placeholder).toEqual({
      emptyState: { title: 'empty-title', subtitle: 'empty-subtitle' },
    })
  })

  it('threads pagination metadata through to PaginatedContent', () => {
    const fetchMore = jest.fn()

    render(
      <QuotesSectionTable<Row>
        {...baseProps}
        metadata={{ currentPage: 1, totalPages: 3, totalCount: 10 }}
        fetchMore={fetchMore}
      />,
    )

    expect(mockPaginatedContentProps.current?.metadata).toEqual({
      currentPage: 1,
      totalPages: 3,
      totalCount: 10,
    })
  })

  it('onPageChange calls fetchMore with the requested page', () => {
    const fetchMore = jest.fn()

    render(
      <QuotesSectionTable<Row>
        {...baseProps}
        metadata={{ currentPage: 1, totalPages: 3, totalCount: 10 }}
        fetchMore={fetchMore}
      />,
    )
    ;(mockPaginatedContentProps.current?.onPageChange as (page: number) => void)(2)
    expect(fetchMore).toHaveBeenCalledWith({ variables: { page: 2 } })
  })

  it('gates the PaginatedContent controls while loading', () => {
    const fetchMore = jest.fn()

    render(
      <QuotesSectionTable<Row>
        {...baseProps}
        isLoading
        metadata={{ currentPage: 1, totalPages: 3, totalCount: 10 }}
        fetchMore={fetchMore}
      />,
    )

    expect(mockPaginatedContentProps.current?.loading).toBe(true)
  })

  it('maps getActions results into action items and returns null when empty', () => {
    const onAction = jest.fn()
    const getActions = jest.fn((row: Row) =>
      row.number === 'OF-1' ? [{ icon: 'stop' as const, label: 'Void', onAction }] : [],
    )

    render(
      <QuotesSectionTable<Row>
        {...baseProps}
        metadata={{ currentPage: 1, totalPages: 1, totalCount: 10 }}
        fetchMore={jest.fn()}
        getActions={getActions}
      />,
    )

    const actionColumn = mockTableProps.current?.actionColumn as (row: Row) => unknown
    const items = actionColumn({ id: '1', number: 'OF-1' }) as Array<{
      startIcon: string
      title: string
      onAction: () => void
    }>

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ startIcon: 'stop', title: 'Void' })
    items[0].onAction()
    expect(onAction).toHaveBeenCalled()

    expect(actionColumn({ id: '2', number: 'OTHER' })).toBeNull()
  })

  it('does not set actionColumn/actionColumnTooltip when getActions is not provided', () => {
    render(
      <QuotesSectionTable<Row>
        {...baseProps}
        metadata={{ currentPage: 1, totalPages: 1, totalCount: 10 }}
        fetchMore={jest.fn()}
      />,
    )

    expect(mockTableProps.current?.actionColumn).toBeUndefined()
    expect(mockTableProps.current?.actionColumnTooltip).toBeUndefined()
  })
})
