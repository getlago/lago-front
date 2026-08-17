import { render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GENERIC_PLACEHOLDER_BUTTON_TEST_ID,
  GENERIC_PLACEHOLDER_TEST_ID,
} from '~/components/designSystem/GenericPlaceholder'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  LagoApiError,
  QuoteDetailItemFragment,
  QuoteDetailsActivityLogsDocument,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import QuoteDetailsActivityLogs, {
  QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID,
} from '../QuoteDetailsActivityLogs'

const QUOTE_ID = 'quote-001'
const ORDER_FORM_ID = 'order-form-001'
const ORDER_ID = 'order-001'
const ACTIVITY_DESCRIPTION = 'Quote QT-2026-0042 was created'

const mockOpenPanel = jest.fn()
const mockSetUrl = jest.fn()
const mockHasPermissions = jest.fn()
const mockIsPremium = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  useDeveloperTool: () => ({
    openPanel: mockOpenPanel,
    setUrl: mockSetUrl,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium() }),
}))

jest.mock('~/hooks/activityLogs/useActivityLogsInformation', () => ({
  useActivityLogsInformation: () => ({
    getActivityDescription: () => ACTIVITY_DESCRIPTION,
    getResourceType: (typename: string) => typename,
  }),
}))

jest.mock('~/hooks/helpers/useFormatterDateHelper', () => ({
  useFormatterDateHelper: () => ({
    formattedDateTimeWithSecondsOrgaTZ: (date: string) => date,
  }),
}))

/** The component reads only `id` and `orderForms`; the rest of the fragment is irrelevant here */
const buildQuote = (
  orderForms: Array<{ id: string; order: { id: string } | null }> = [
    { id: ORDER_FORM_ID, order: { id: ORDER_ID } },
  ],
): QuoteDetailItemFragment =>
  ({
    id: QUOTE_ID,
    orderForms,
  }) as unknown as QuoteDetailItemFragment

const grantPermissions = (granted: Array<string>): void => {
  mockHasPermissions.mockImplementation((permissions: Array<string>) =>
    permissions.every((permission) => granted.includes(permission)),
  )
}

const ALL_PERMISSIONS = ['auditLogsView', 'orderFormsView', 'ordersView']

const buildActivityLog = (activityId: string) => ({
  __typename: 'ActivityLog' as const,
  activityId,
  activityType: 'quote_created',
  activityObject: { number: 'QT-2026-0042' },
  loggedAt: '2026-08-17T10:00:00Z',
  externalCustomerId: 'ext-cust-001',
  externalSubscriptionId: null,
})

const buildVariables = (resourceIds: Array<string>) => ({
  resourceIds,
  limit: DEFAULT_PAGE_SIZE,
})

const buildResult = ({
  activityIds,
  currentPage = 1,
  totalPages = 1,
  totalCount = 1,
}: {
  activityIds: Array<string>
  currentPage?: number
  totalPages?: number
  totalCount?: number
}) => ({
  data: {
    activityLogs: {
      __typename: 'ActivityLogCollection' as const,
      collection: activityIds.map(buildActivityLog),
      metadata: {
        __typename: 'CollectionMetadata' as const,
        currentPage,
        totalPages,
        totalCount,
      },
    },
  },
})

const buildMocks = ({
  resourceIds = [QUOTE_ID, ORDER_FORM_ID, ORDER_ID],
  activityIds = ['activity-001'],
  totalPages = 1,
  totalCount = 1,
}: {
  resourceIds?: Array<string>
  activityIds?: Array<string>
  totalPages?: number
  totalCount?: number
} = {}): TestMocksType => [
  {
    request: {
      query: QuoteDetailsActivityLogsDocument,
      variables: buildVariables(resourceIds),
    },
    result: buildResult({ activityIds, totalPages, totalCount }),
  },
]

const buildErrorMocks = (code: LagoApiError): TestMocksType => [
  {
    request: {
      query: QuoteDetailsActivityLogsDocument,
      variables: buildVariables([QUOTE_ID, ORDER_FORM_ID, ORDER_ID]),
    },
    result: {
      errors: [{ message: code, extensions: { code } }],
    },
  },
]

const renderComponent = (
  mocks: TestMocksType,
  options: { quote?: QuoteDetailItemFragment | null; loading?: boolean } = {},
) => {
  // `'quote' in options` rather than a destructuring default: a default also fires on an explicit
  // `undefined`, which would silently hand a loaded quote to the "not loaded yet" cases
  const quote = 'quote' in options ? options.quote : buildQuote()

  return rtlRender(
    <AllTheProviders mocks={mocks} forceTypenames>
      <QuoteDetailsActivityLogs quote={quote} loading={options.loading ?? false} />
    </AllTheProviders>,
  )
}

describe('QuoteDetailsActivityLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    grantPermissions(ALL_PERMISSIONS)
    mockIsPremium.mockReturnValue(true)
  })

  describe('GIVEN the user is premium and has every relevant permission', () => {
    describe('WHEN the logs resolve', () => {
      it('THEN should render the container', () => {
        renderComponent(buildMocks())

        expect(screen.getByTestId(QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render one row per activity log', async () => {
        renderComponent(
          buildMocks({ activityIds: ['activity-001', 'activity-002'], totalCount: 2 }),
        )

        await waitFor(() => {
          expect(screen.getAllByText(ACTIVITY_DESCRIPTION)).toHaveLength(2)
        })
      })

      it('THEN should not render a placeholder', async () => {
        renderComponent(buildMocks())

        await waitFor(() => {
          expect(screen.getByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
        })

        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the logs are still loading', () => {
      it('THEN should not render any row yet', () => {
        renderComponent(buildMocks())

        expect(screen.queryByText(ACTIVITY_DESCRIPTION)).not.toBeInTheDocument()
      })
    })

    describe('WHEN a row is clicked', () => {
      it('THEN should open the developer tool on that activity log', async () => {
        const user = userEvent.setup()

        renderComponent(buildMocks())

        await waitFor(() => {
          expect(screen.getByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
        })

        await user.click(screen.getByText(ACTIVITY_DESCRIPTION))

        expect(mockOpenPanel).toHaveBeenCalled()
        expect(mockSetUrl).toHaveBeenCalledWith(expect.stringContaining('activity-001'))
      })
    })

    describe('WHEN there is more than one page', () => {
      it('THEN should render the pager', async () => {
        renderComponent(buildMocks({ totalPages: 3, totalCount: 42 }))

        await waitFor(() => {
          expect(screen.getByTestId('pagination')).toBeInTheDocument()
        })
      })

      it('THEN should request the next page when the next arrow is clicked', async () => {
        const user = userEvent.setup()
        const nextPageResult = jest.fn(() =>
          buildResult({
            activityIds: ['activity-page-2'],
            currentPage: 2,
            totalPages: 3,
            totalCount: 42,
          }),
        )

        renderComponent([
          ...buildMocks({ totalPages: 3, totalCount: 42 }),
          {
            request: {
              query: QuoteDetailsActivityLogsDocument,
              variables: { ...buildVariables([QUOTE_ID, ORDER_FORM_ID, ORDER_ID]), page: 2 },
            },
            result: nextPageResult,
          },
        ])

        await waitFor(() => {
          expect(screen.getByTestId('pagination')).toBeInTheDocument()
        })

        await user.click(screen.getByRole('button', { name: 'next page' }))

        await waitFor(() => {
          expect(nextPageResult).toHaveBeenCalled()
        })
      })
    })
  })

  describe('GIVEN the quote has downstream resources', () => {
    describe('WHEN the quote has no order form', () => {
      it('THEN should query the quote id alone', async () => {
        renderComponent(buildMocks({ resourceIds: [QUOTE_ID] }), { quote: buildQuote([]) })

        await waitFor(() => {
          expect(screen.getByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
        })
      })
    })

    describe('WHEN an order form has no order yet', () => {
      it('THEN should query the quote and order form ids only', async () => {
        renderComponent(buildMocks({ resourceIds: [QUOTE_ID, ORDER_FORM_ID] }), {
          quote: buildQuote([{ id: ORDER_FORM_ID, order: null }]),
        })

        await waitFor(() => {
          expect(screen.getByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
        })
      })
    })

    // The two gates are independent: each resource kind is requested only when its own detail
    // page is reachable, so denying one does not suppress the other
    describe('WHEN the user cannot view order forms', () => {
      it('THEN should query the quote and order ids only', async () => {
        grantPermissions(['auditLogsView', 'ordersView'])

        renderComponent(buildMocks({ resourceIds: [QUOTE_ID, ORDER_ID] }))

        await waitFor(() => {
          expect(screen.getByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
        })
      })
    })

    describe('WHEN the user cannot view orders', () => {
      it('THEN should query the quote and order form ids only', async () => {
        grantPermissions(['auditLogsView', 'orderFormsView'])

        renderComponent(buildMocks({ resourceIds: [QUOTE_ID, ORDER_FORM_ID] }))

        await waitFor(() => {
          expect(screen.getByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
        })
      })
    })

    describe('WHEN the user can view neither order forms nor orders', () => {
      it('THEN should query the quote id alone', async () => {
        grantPermissions(['auditLogsView'])

        renderComponent(buildMocks({ resourceIds: [QUOTE_ID] }))

        await waitFor(() => {
          expect(screen.getByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the quote is not loaded yet', () => {
    // An empty id list would drop the filter server-side and return the whole organization's
    // activity log, so the query must not fire at all
    const emptyIdsMocks = (result: jest.Mock): TestMocksType => [
      {
        request: {
          query: QuoteDetailsActivityLogsDocument,
          variables: buildVariables([]),
        },
        result,
      },
    ]

    describe('WHEN the quote is still loading', () => {
      it('THEN should not fire the query', async () => {
        const result = jest.fn(() => buildResult({ activityIds: ['activity-001'] }))

        renderComponent(emptyIdsMocks(result), { quote: null, loading: true })

        await waitFor(() => {
          expect(screen.getByTestId(QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID)).toBeInTheDocument()
        })

        expect(result).not.toHaveBeenCalled()
        expect(screen.queryByText(ACTIVITY_DESCRIPTION)).not.toBeInTheDocument()
      })

      it('THEN should fold the quote fetch into the section loading state', async () => {
        const result = jest.fn(() => buildResult({ activityIds: ['activity-001'] }))

        renderComponent(emptyIdsMocks(result), { quote: null, loading: true })

        await waitFor(() => {
          expect(screen.getByTestId(QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID)).toBeInTheDocument()
        })

        // Loading renders skeleton rows. The empty placeholder here would mean the quote fetch
        // was not folded in, so the tab would flash "no logs" before the quote resolves.
        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the quote resolved to nothing', () => {
      it('THEN should render the empty state without firing the query', async () => {
        const result = jest.fn(() => buildResult({ activityIds: ['activity-001'] }))

        renderComponent(emptyIdsMocks(result), { quote: null, loading: false })

        await waitFor(() => {
          expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        })

        expect(result).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the query fails', () => {
    describe('WHEN the feature is not available on the current plan', () => {
      it('THEN should render the error placeholder without a retry button', async () => {
        renderComponent(buildErrorMocks(LagoApiError.FeatureUnavailable))

        await waitFor(() => {
          expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        })

        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the error is not a premium limitation', () => {
      it('THEN should render the error placeholder with a retry button', async () => {
        renderComponent(buildErrorMocks(LagoApiError.InternalError))

        await waitFor(() => {
          expect(screen.getByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID)).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the logs cannot be viewed', () => {
    describe.each([
      ['the user is not premium', { isPremium: false, granted: ALL_PERMISSIONS }],
      [
        'the user lacks the auditLogsView permission',
        { isPremium: true, granted: ['orderFormsView', 'ordersView'] },
      ],
    ])('WHEN %s', (_, { isPremium, granted }) => {
      it('THEN should skip the query and render no row', async () => {
        mockIsPremium.mockReturnValue(isPremium)
        grantPermissions(granted)

        renderComponent(buildMocks())

        await waitFor(() => {
          expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        })

        expect(screen.queryByText(ACTIVITY_DESCRIPTION)).not.toBeInTheDocument()
      })
    })
  })
})
