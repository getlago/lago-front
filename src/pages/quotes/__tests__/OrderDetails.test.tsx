import { screen } from '@testing-library/react'

import {
  OrderExecutionModeEnum,
  OrderStatusEnum,
  useGetOrderForEditQuery,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import OrderDetails from '../OrderDetails'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: (date: string) => ({
      date: new Date(date).toLocaleDateString('en-US'),
    }),
  }),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ orderId: 'order-1' }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetOrderForEditQuery: jest.fn(),
}))

const mockUseGetOrderForEditQuery = useGetOrderForEditQuery as jest.MockedFunction<
  typeof useGetOrderForEditQuery
>

const order = {
  id: 'order-1',
  number: 'ORD-2026-0001',
  status: OrderStatusEnum.Executed,
  orderType: null,
  executeAt: '2026-04-10T10:00:00Z',
  executionMode: OrderExecutionModeEnum.ExecuteInLago,
  customer: { id: 'c-1', name: 'Acme', displayName: 'Acme Corp' },
  orderForm: {
    id: 'of-1',
    number: 'OF-1',
    quote: {
      id: 'q-1',
      number: 'QUO-001',
      images: {},
      customer: { id: 'c-1', displayName: 'Acme Corp' },
      currentVersion: { id: 'qv-1', version: 1, content: '# Hi', mentionVariables: {} },
    },
  },
}

describe('OrderDetails', () => {
  it('renders the order number, customer and execution settings read-only', () => {
    mockUseGetOrderForEditQuery.mockReturnValue({
      data: { order },
      loading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useGetOrderForEditQuery>)

    render(<OrderDetails />)

    expect(screen.getAllByText('ORD-2026-0001').length).toBeGreaterThan(0)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    // execution date formatted by the mocked org-tz formatter
    expect(screen.getByText('4/10/2026')).toBeInTheDocument()
  })

  it('shows the loading skeleton while fetching', () => {
    mockUseGetOrderForEditQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as unknown as ReturnType<typeof useGetOrderForEditQuery>)

    render(<OrderDetails />)

    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
  })
})
