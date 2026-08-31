import { render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GENERIC_PLACEHOLDER_BUTTON_TEST_ID,
  GENERIC_PLACEHOLDER_TEST_ID,
} from '~/components/designSystem/GenericPlaceholder'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  LagoApiError,
  ProductCategoryActivityLogsDocument,
  ResourceTypeEnum,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import ProductCategoryActivityLogs from '../ProductCategoryActivityLogs'

const PRODUCT_CATEGORY_ID = 'product-category-001'
const SUBTITLE_KEY = 'text_1788164971209jpekwrfqvn6'
const ACTIVITY_DESCRIPTION = 'Object storage was updated'

const mockOpenPanel = jest.fn()
const mockSetUrl = jest.fn()
const mockHasPermissions = jest.fn()
const mockIsPremium = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  useDeveloperTool: () => ({ openPanel: mockOpenPanel, setUrl: mockSetUrl }),
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

const grantPermissions = (granted: Array<string>): void => {
  mockHasPermissions.mockImplementation((permissions: Array<string>) =>
    permissions.every((permission) => granted.includes(permission)),
  )
}

const buildActivityLog = (activityId: string) => ({
  __typename: 'ActivityLog' as const,
  activityId,
  activityType: 'product_category_updated',
  activityObject: { name: 'Object storage' },
  loggedAt: '2026-08-17T10:00:00Z',
  externalCustomerId: null,
  externalSubscriptionId: null,
})

/** The resource type and id are what distinguish this component from its sibling
 *  activity-log components: an exact-variable mock only matches when both are right. */
const QUERY_VARIABLES = {
  resourceTypes: [ResourceTypeEnum.ProductCategory],
  resourceIds: [PRODUCT_CATEGORY_ID],
  limit: DEFAULT_PAGE_SIZE,
}

const buildResult = ({
  activityIds = ['activity-001'],
  currentPage = 1,
  totalPages = 1,
  totalCount = 1,
}: {
  activityIds?: Array<string>
  currentPage?: number
  totalPages?: number
  totalCount?: number
} = {}) => ({
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

const buildMocks = (options: Parameters<typeof buildResult>[0] = {}): TestMocksType => [
  {
    request: { query: ProductCategoryActivityLogsDocument, variables: QUERY_VARIABLES },
    result: buildResult(options),
  },
]

const buildErrorMocks = (code: LagoApiError): TestMocksType => [
  {
    request: { query: ProductCategoryActivityLogsDocument, variables: QUERY_VARIABLES },
    result: { errors: [{ message: code, extensions: { code } }] },
  },
]

const renderComponent = (
  mocks: TestMocksType,
  options: { productCategoryId?: string | undefined } = {},
) => {
  // `'productCategoryId' in options` rather than a destructuring default: a default also fires on
  // an explicit `undefined`, which would silently hand a real id to the "no id yet" case
  const productCategoryId =
    'productCategoryId' in options ? options.productCategoryId : PRODUCT_CATEGORY_ID

  return rtlRender(
    <AllTheProviders mocks={mocks} forceTypenames>
      <ProductCategoryActivityLogs productCategoryId={productCategoryId} />
    </AllTheProviders>,
  )
}

// `variableMatcher` accepts any variables so a query fired with unexpected ones still
// trips `result` rather than slipping through as an unmatched-mock error
const anyQueryMocks = (result: jest.Mock): TestMocksType => [
  {
    request: { query: ProductCategoryActivityLogsDocument },
    variableMatcher: () => true,
    result,
  },
]

describe('ProductCategoryActivityLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    grantPermissions(['auditLogsView'])
    mockIsPremium.mockReturnValue(true)
  })

  describe('GIVEN the user can view audit logs', () => {
    describe('WHEN the logs resolve', () => {
      it('THEN should query the product category resource type and id', async () => {
        renderComponent(buildMocks())

        await waitFor(() => {
          expect(screen.getByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
        })
      })

      it('THEN should render one row per activity log', async () => {
        renderComponent(
          buildMocks({ activityIds: ['activity-001', 'activity-002'], totalCount: 2 }),
        )

        await waitFor(() => {
          expect(screen.getAllByText(ACTIVITY_DESCRIPTION)).toHaveLength(2)
        })
      })

      it('THEN should render the product category subtitle', () => {
        renderComponent(buildMocks())

        expect(screen.getByText(SUBTITLE_KEY)).toBeInTheDocument()
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
      it('THEN should request the next page through fetchMore', async () => {
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
              query: ProductCategoryActivityLogsDocument,
              variables: { ...QUERY_VARIABLES, page: 2 },
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

  describe('GIVEN the route param is not available', () => {
    describe('WHEN the product category id is undefined', () => {
      // An absent id would drop the filter server-side and return the whole
      // organization's activity log, so the query must not fire at all
      it('THEN should skip the query and render the empty state', async () => {
        const result = jest.fn(() => buildResult())

        renderComponent(anyQueryMocks(result), { productCategoryId: undefined })

        await waitFor(() => {
          expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        })

        expect(result).not.toHaveBeenCalled()
        expect(screen.queryByText(ACTIVITY_DESCRIPTION)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the logs cannot be viewed', () => {
    describe.each([
      ['the user is not premium', { isPremium: false, granted: ['auditLogsView'] }],
      ['the user lacks the auditLogsView permission', { isPremium: true, granted: [] }],
    ])('WHEN %s', (_, { isPremium, granted }) => {
      it('THEN should skip the query and render the empty state', async () => {
        const result = jest.fn(() => buildResult())

        mockIsPremium.mockReturnValue(isPremium)
        grantPermissions(granted)

        renderComponent(anyQueryMocks(result))

        await waitFor(() => {
          expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        })

        expect(result).not.toHaveBeenCalled()
        expect(screen.queryByText(ACTIVITY_DESCRIPTION)).not.toBeInTheDocument()
      })
    })
  })
})
