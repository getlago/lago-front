import { ApolloError } from '@apollo/client'
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
import { QUOTE_MUTATION_SILENT_ERROR_CODES } from '../utils/quoteMutationErrors'

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
const mockUseExecuteOrderMutation = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetOrderForExecuteQuery: (...args: unknown[]) => mockUseGetOrderForExecuteQuery(...args),
  useExecuteOrderMutation: (...args: unknown[]) => {
    mockUseExecuteOrderMutation(...args)

    return [mockExecuteOrder, { loading: false }]
  },
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

// Mirrors what `ExecutionErrorResponder` puts on a failed `executeOrder`: a top-level code
// plus a camelized `field -> [errorCode]` detail map.
const makeGraphQLErrors = (
  code: string,
  details?: Record<string, string[]>,
): ApolloError['graphQLErrors'] =>
  [
    {
      message: 'error',
      extensions: details ? { code, details } : { code },
    },
  ] as never

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

  describe('API error handling', () => {
    it('silences the error codes it handles locally', () => {
      render(<ExecuteOrder />)

      expect(mockUseExecuteOrderMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          context: { silentErrorCodes: [...QUOTE_MUTATION_SILENT_ERROR_CODES] },
        }),
      )

      // The link pushes its own force-silenced codes onto the array it receives, so passing
      // the shared constant itself would mutate it for every other caller.
      const { context } = mockUseExecuteOrderMutation.mock.calls[0][0]

      expect(context.silentErrorCodes).not.toBe(QUOTE_MUTATION_SILENT_ERROR_CODES)
    })

    it('toasts the mapped message and stays on the page when execution fails', async () => {
      mockExecuteOrder.mockResolvedValueOnce({
        data: { executeOrder: null },
        errors: makeGraphQLErrors('unprocessable_entity', {
          executionMode: ['value_is_mandatory'],
        }),
      })

      const user = userEvent.setup()

      render(<ExecuteOrder />)

      await user.click(screen.getByTestId(EXECUTE_ORDER_SUBMIT_BUTTON_TEST_ID))

      // Pins the order-scoped copy: the order-form scope would resolve
      // `text_17866108946411ovi8xqry3n` here, and the quote scope the generic message.
      await waitFor(() => {
        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          message: 'text_1786630268015x89z5erp5gc',
        })
      })
      expect(addToast).toHaveBeenCalledTimes(1)
      expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      expect(testMockNavigateFn).not.toHaveBeenCalled()
    })

    // The error link force-silences `forbidden`, so without the local branch this failure
    // produced no feedback at all.
    it('toasts a permission failure the link would otherwise swallow', async () => {
      mockExecuteOrder.mockResolvedValueOnce({
        data: { executeOrder: null },
        errors: makeGraphQLErrors('forbidden'),
      })

      const user = userEvent.setup()

      render(<ExecuteOrder />)

      await user.click(screen.getByTestId(EXECUTE_ORDER_SUBMIT_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          message: 'text_17865407897429mqm1fco12j',
        })
      })
      expect(testMockNavigateFn).not.toHaveBeenCalled()
    })

    it('toasts one message per key of a multi-key failure', async () => {
      mockExecuteOrder.mockResolvedValueOnce({
        data: { executeOrder: null },
        errors: makeGraphQLErrors('not_found', {
          plan: ['not_found'],
          coupon: ['not_found'],
        }),
      })

      const user = userEvent.setup()

      render(<ExecuteOrder />)

      await user.click(screen.getByTestId(EXECUTE_ORDER_SUBMIT_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(addToast).toHaveBeenCalledTimes(2)
      })

      expect(addToast).toHaveBeenCalledWith({
        severity: 'danger',
        message: 'text_1786630268016ukk6fi5u778',
      })
      expect(addToast).toHaveBeenCalledWith({
        severity: 'danger',
        message: 'text_1786630268016171ivs0g1kv',
      })
    })

    it('does not leave a failure silent when the API sends no details', async () => {
      mockExecuteOrder.mockResolvedValueOnce({
        data: { executeOrder: null },
        errors: makeGraphQLErrors('unprocessable_entity'),
      })

      const user = userEvent.setup()

      render(<ExecuteOrder />)

      await user.click(screen.getByTestId(EXECUTE_ORDER_SUBMIT_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          message: 'text_622f7a3dc32ce100c46a5154',
        })
      })
      expect(addToast).toHaveBeenCalledTimes(1)
    })
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
