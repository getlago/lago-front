import { render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GENERIC_PLACEHOLDER_BUTTON_TEST_ID,
  GENERIC_PLACEHOLDER_TEST_ID,
} from '~/components/designSystem/GenericPlaceholder'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  LagoApiError,
  QuoteDetailsActivityLogsDocument,
  ResourceTypeEnum,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import QuoteDetailsActivityLogs, {
  QUOTE_ACTIVITY_LOGS_CONTAINER_TEST_ID,
} from '../QuoteDetailsActivityLogs'

const QUOTE_ID = 'quote-001'
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

const buildActivityLog = (activityId: string) => ({
  __typename: 'ActivityLog' as const,
  activityId,
  activityType: 'quote_created',
  activityObject: { number: 'QT-2026-0042' },
  loggedAt: '2026-08-17T10:00:00Z',
  externalCustomerId: 'ext-cust-001',
  externalSubscriptionId: null,
})

const baseVariables = {
  resourceTypes: [ResourceTypeEnum.Quote],
  resourceIds: [QUOTE_ID],
  limit: DEFAULT_PAGE_SIZE,
}

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

const buildMocks = (
  options: {
    activityIds?: Array<string>
    totalPages?: number
    totalCount?: number
  } = {},
): TestMocksType => [
  {
    request: {
      query: QuoteDetailsActivityLogsDocument,
      variables: baseVariables,
    },
    result: buildResult({ activityIds: ['activity-001'], ...options }),
  },
]

const buildErrorMocks = (code: LagoApiError): TestMocksType => [
  {
    request: {
      query: QuoteDetailsActivityLogsDocument,
      variables: baseVariables,
    },
    result: {
      errors: [{ message: code, extensions: { code } }],
    },
  },
]

const renderComponent = (mocks: TestMocksType) =>
  rtlRender(
    <AllTheProviders mocks={mocks} forceTypenames>
      <QuoteDetailsActivityLogs quoteId={QUOTE_ID} />
    </AllTheProviders>,
  )

describe('QuoteDetailsActivityLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium.mockReturnValue(true)
  })

  describe('GIVEN the user is premium and has the auditLogsView permission', () => {
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
              variables: { ...baseVariables, page: 2 },
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
      ['the user is not premium', { isPremium: false, hasPermissions: true }],
      ['the user lacks the auditLogsView permission', { isPremium: true, hasPermissions: false }],
    ])('WHEN %s', (_, { isPremium, hasPermissions }) => {
      it('THEN should skip the query and render no row', async () => {
        mockIsPremium.mockReturnValue(isPremium)
        mockHasPermissions.mockReturnValue(hasPermissions)

        renderComponent(buildMocks())

        await waitFor(() => {
          expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        })

        expect(screen.queryByText(ACTIVITY_DESCRIPTION)).not.toBeInTheDocument()
      })
    })
  })
})
