import { screen } from '@testing-library/react'

import { OrderFormStatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useOrderForms } from '../hooks/useOrderForms'
import OrderFormsList from '../OrderFormsList'

const mockIntersectionObserver = jest.fn()

mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})

globalThis.IntersectionObserver = mockIntersectionObserver

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: (date: string) => ({
      date: new Date(date).toLocaleDateString('en-US'),
    }),
  }),
}))

jest.mock('../hooks/useOrderForms', () => ({
  useOrderForms: jest.fn(),
}))

const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

jest.mock('~/pages/quotes/common/QuotePdfProvider', () => ({
  useDownloadQuotePdf: () => ({ download: jest.fn() }),
}))

const mockUseOrderForms = useOrderForms as jest.MockedFunction<typeof useOrderForms>

const mockOrderForms = [
  {
    id: 'of-1',
    number: 'OF-2026-0001',
    status: OrderFormStatusEnum.Generated,
    createdAt: '2026-04-10T10:00:00Z',
    customer: { id: 'customer-001', name: 'Acme Corp', displayName: 'Acme Corp' },
    quote: {
      id: 'q-1',
      number: 'QUO-001',
      currentVersion: { id: 'qv-1', version: 1, content: '# Order Form 1' },
    },
  },
  {
    id: 'of-2',
    number: 'OF-2026-0002',
    status: OrderFormStatusEnum.Signed,
    createdAt: '2026-04-11T14:00:00Z',
    customer: { id: 'customer-002', name: 'Globex Inc', displayName: 'Globex Inc' },
    quote: {
      id: 'q-2',
      number: 'QUO-002',
      currentVersion: { id: 'qv-2', version: 3, content: '# Order Form 2' },
    },
  },
  {
    id: 'of-3',
    number: 'OF-2026-0003',
    status: OrderFormStatusEnum.Voided,
    createdAt: '2026-04-12T08:00:00Z',
    customer: { id: 'customer-003', name: 'Wayne Enterprises', displayName: 'Wayne Enterprises' },
    quote: {
      id: 'q-3',
      number: 'QUO-003',
      currentVersion: { id: 'qv-3', version: 2, content: '# Order Form 3' },
    },
  },
]

describe('OrderFormsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseOrderForms.mockReturnValue({
      orderForms: mockOrderForms,
      loading: false,
      error: undefined,
      fetchMore: jest.fn(),
      metadata: { currentPage: 1, totalPages: 1, totalCount: 3 },
    })
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN order forms are loaded', () => {
      it('THEN should render the table with rows', () => {
        render(<OrderFormsList />)

        expect(screen.getByTestId('table-row-0')).toBeInTheDocument()
        expect(screen.getByTestId('table-row-1')).toBeInTheDocument()
        expect(screen.getByTestId('table-row-2')).toBeInTheDocument()
      })

      it('THEN should display order form numbers', () => {
        render(<OrderFormsList />)

        expect(screen.getByText('OF-2026-0001')).toBeInTheDocument()
        expect(screen.getByText('OF-2026-0002')).toBeInTheDocument()
        expect(screen.getByText('OF-2026-0003')).toBeInTheDocument()
      })

      it('THEN should display customer names', () => {
        render(<OrderFormsList />)

        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
        expect(screen.getByText('Globex Inc')).toBeInTheDocument()
        expect(screen.getByText('Wayne Enterprises')).toBeInTheDocument()
      })

      it('THEN should display status badges', () => {
        render(<OrderFormsList />)

        const statusBadges = screen.getAllByTestId('status')

        expect(statusBadges).toHaveLength(3)
      })
    })

    describe('WHEN order forms are loading', () => {
      it('THEN should show the table in loading state', () => {
        mockUseOrderForms.mockReturnValue({
          orderForms: [],
          loading: true,
          error: undefined,
          fetchMore: jest.fn(),
          metadata: undefined,
        })

        render(<OrderFormsList />)

        expect(screen.getByTestId('table-order-forms-list')).toBeInTheDocument()
      })
    })

    describe('WHEN there are no order forms', () => {
      it('THEN should show empty state', () => {
        mockUseOrderForms.mockReturnValue({
          orderForms: [],
          loading: false,
          error: undefined,
          fetchMore: jest.fn(),
          metadata: undefined,
        })

        render(<OrderFormsList />)

        expect(screen.queryByTestId('table-row-0')).not.toBeInTheDocument()
      })
    })

    describe('WHEN order forms have actions', () => {
      it('THEN should render action buttons for each row', () => {
        render(<OrderFormsList />)

        const actionButtons = screen.getAllByTestId('open-action-button')

        expect(actionButtons.length).toBeGreaterThan(0)
      })
    })
  })
})
