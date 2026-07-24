import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast } from '~/core/apolloClient'
import { OrderExecutionModeEnum, OrderStatusEnum, OrderTypeEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import ExecuteOrder, {
  EXECUTE_ORDER_ALERT_TEST_ID,
  EXECUTE_ORDER_CANCEL_BUTTON_TEST_ID,
  EXECUTE_ORDER_CLOSE_BUTTON_TEST_ID,
  EXECUTE_ORDER_PREVIEW_TEST_ID,
  EXECUTE_ORDER_SUBMIT_BUTTON_TEST_ID,
} from '../ExecuteOrder'

jest.mock('~/components/designSystem/RichTextEditor/RichTextEditor', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    <div data-test="rich-text-editor" data-mode={props.mode} />
  ),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: (date: string) => ({ date }),
  }),
}))

jest.mock('~/core/serializers/serializeQuoteBillingItems', () => ({
  buildPreviewEntities: jest.fn(() => ({})),
}))

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 56,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: String(i),
        start: i * 56,
        size: 56,
      })),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}:${JSON.stringify(vars)}` : key,
  }),
}))

const mockGoBack = jest.fn()

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({ goBack: mockGoBack }),
}))

const mockExecuteOrder = jest.fn()
const mockUseGetOrderForExecuteQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetOrderForExecuteQuery: (...args: unknown[]) => mockUseGetOrderForExecuteQuery(...args),
  useExecuteOrderMutation: () => [mockExecuteOrder, { loading: false }],
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockOrder = {
  id: 'order-123',
  number: 'OR-2026-0001',
  status: OrderStatusEnum.Created,
  orderType: OrderTypeEnum.SubscriptionCreation,
  executeAt: '2030-12-25T12:00:00.000Z',
  executionMode: OrderExecutionModeEnum.ExecuteInLago,
  customer: { id: 'customer-001', name: 'Acme Corp', displayName: 'Acme Corp' },
  orderForm: {
    id: 'of-1',
    number: 'OF-2026-0001',
    quote: {
      id: 'quote-456',
      number: 'QT-2026-0042',
      currentVersion: { id: 'qv-1', version: 1, content: '# Hello World', billingItems: null },
      customer: { id: 'customer-001' },
    },
  },
}

describe('ExecuteOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ orderId: 'order-123' })
    mockUseGetOrderForExecuteQuery.mockReturnValue({
      data: { order: mockOrder },
      loading: false,
      error: undefined,
    })
  })

  it('renders the document preview card with the order number', () => {
    render(<ExecuteOrder />)

    expect(screen.getByTestId(EXECUTE_ORDER_PREVIEW_TEST_ID)).toHaveTextContent('OR-2026-0001')
  })

  it('renders read-only order fields and the warning alert', () => {
    render(<ExecuteOrder />)

    // Order form information: number, customer, source quote "number - vN"
    expect(screen.getByText('OR-2026-0001')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('QT-2026-0042 - v1')).toBeInTheDocument()
    // Execution type maps to the "Executed in Lago" label key
    expect(screen.getByText('text_1781686594125wc395bj9cul')).toBeInTheDocument()
    // Previsional execution date (intlFormatDateTimeOrgaTZ mock returns the iso back)
    expect(screen.getByText('2030-12-25T12:00:00.000Z')).toBeInTheDocument()
    expect(screen.getByTestId(EXECUTE_ORDER_ALERT_TEST_ID)).toBeInTheDocument()
  })

  it('executes the order and navigates to the quote Orders tab on success', async () => {
    mockExecuteOrder.mockResolvedValueOnce({
      data: { executeOrder: { id: 'order-123', status: OrderStatusEnum.Executed } },
    })

    const user = userEvent.setup()

    render(<ExecuteOrder />)

    await user.click(screen.getByTestId(EXECUTE_ORDER_SUBMIT_BUTTON_TEST_ID))

    await waitFor(() => {
      expect(mockExecuteOrder).toHaveBeenCalledWith({
        variables: { input: { id: 'order-123' } },
      })
    })

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })
    expect(testMockNavigateFn).toHaveBeenCalledWith('/quote/quote-456/orders')
  })

  it('stays on the page when the mutation returns no data', async () => {
    mockExecuteOrder.mockResolvedValueOnce({ data: null })

    const user = userEvent.setup()

    render(<ExecuteOrder />)

    await user.click(screen.getByTestId(EXECUTE_ORDER_SUBMIT_BUTTON_TEST_ID))

    await waitFor(() => {
      expect(mockExecuteOrder).toHaveBeenCalled()
    })
    expect(testMockNavigateFn).not.toHaveBeenCalled()
  })

  it('navigates back (goBack) via cancel and close buttons', async () => {
    const user = userEvent.setup()

    render(<ExecuteOrder />)

    await user.click(screen.getByTestId(EXECUTE_ORDER_CANCEL_BUTTON_TEST_ID))
    expect(mockGoBack).toHaveBeenCalledTimes(1)

    await user.click(screen.getByTestId(EXECUTE_ORDER_CLOSE_BUTTON_TEST_ID))
    expect(mockGoBack).toHaveBeenCalledTimes(2)
  })
})
