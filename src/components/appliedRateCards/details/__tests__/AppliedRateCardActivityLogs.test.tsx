import { render as rtlRender, screen, waitFor } from '@testing-library/react'

import { ACTIVITY_LOGS_SECTION_SUBTITLE_TEST_ID } from '~/components/activityLogs/ActivityLogsSection'
import {
  GENERIC_PLACEHOLDER_BUTTON_TEST_ID,
  GENERIC_PLACEHOLDER_TEST_ID,
} from '~/components/designSystem/GenericPlaceholder'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  AppliedRateCardActivityLogsDocument,
  LagoApiError,
  ResourceTypeEnum,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { AppliedRateCardContext } from '../../types'
import { AppliedRateCardActivityLogs } from '../AppliedRateCardActivityLogs'

const APPLIED_RATE_CARD_ID = 'applied-rate-card-001'
const SUBTITLE_KEY = 'text_1792506302406m3twa4pwimw'
const ACTIVITY_DESCRIPTION = 'Rate card was updated'

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

const RESOURCE_TYPE_BY_CONTEXT: Record<AppliedRateCardContext, ResourceTypeEnum> = {
  plan: ResourceTypeEnum.PlanRateCard,
  contract: ResourceTypeEnum.ContractRateCard,
}

const buildQueryVariables = (
  context: AppliedRateCardContext,
): {
  resourceTypes: Array<ResourceTypeEnum>
  resourceIds: Array<string>
  limit: number
} => ({
  resourceTypes: [RESOURCE_TYPE_BY_CONTEXT[context]],
  resourceIds: [APPLIED_RATE_CARD_ID],
  limit: DEFAULT_PAGE_SIZE,
})

const buildResult = (): { data: { activityLogs: object } } => ({
  data: {
    activityLogs: {
      __typename: 'ActivityLogCollection' as const,
      collection: [
        {
          __typename: 'ActivityLog' as const,
          activityId: 'activity-001',
          activityType: 'plan_rate_card_updated',
          activityObject: { name: 'Seats' },
          loggedAt: '2026-08-17T10:00:00Z',
          externalCustomerId: null,
          externalSubscriptionId: null,
        },
      ],
      metadata: {
        __typename: 'CollectionMetadata' as const,
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
      },
    },
  },
})

const buildMocks = (context: AppliedRateCardContext): TestMocksType => [
  {
    request: {
      query: AppliedRateCardActivityLogsDocument,
      variables: buildQueryVariables(context),
    },
    result: buildResult(),
  },
]

const buildErrorMocks = (context: AppliedRateCardContext, code: LagoApiError): TestMocksType => [
  {
    request: {
      query: AppliedRateCardActivityLogsDocument,
      variables: buildQueryVariables(context),
    },
    result: { errors: [{ message: code, extensions: { code } }] },
  },
]

// `variableMatcher` accepts any variables so a query fired with unexpected ones still
// trips `result` rather than slipping through as an unmatched-mock error
const anyQueryMocks = (result: jest.Mock): TestMocksType => [
  {
    request: { query: AppliedRateCardActivityLogsDocument },
    variableMatcher: () => true,
    result,
  },
]

const renderComponent = (context: AppliedRateCardContext, mocks: TestMocksType) =>
  rtlRender(
    <AllTheProviders mocks={mocks} forceTypenames>
      <AppliedRateCardActivityLogs context={context} appliedRateCardId={APPLIED_RATE_CARD_ID} />
    </AllTheProviders>,
  )

describe('AppliedRateCardActivityLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    grantPermissions(['auditLogsView'])
    mockIsPremium.mockReturnValue(true)
  })

  describe('GIVEN a plan card', () => {
    it('THEN queries activity logs scoped to PlanRateCard and the card id', async () => {
      renderComponent('plan', buildMocks('plan'))

      expect(await screen.findByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
    })

    it('THEN renders the tab subtitle', async () => {
      renderComponent('plan', buildMocks('plan'))

      expect(await screen.findByTestId(ACTIVITY_LOGS_SECTION_SUBTITLE_TEST_ID)).toHaveTextContent(
        SUBTITLE_KEY,
      )
    })
  })

  describe('GIVEN a contract card', () => {
    it('THEN queries activity logs scoped to ContractRateCard and the card id', async () => {
      renderComponent('contract', buildMocks('contract'))

      expect(await screen.findByText(ACTIVITY_DESCRIPTION)).toBeInTheDocument()
    })
  })

  describe('GIVEN the query fails', () => {
    describe('WHEN the feature is not available on the current plan', () => {
      it('THEN renders the error placeholder without a retry button', async () => {
        renderComponent('plan', buildErrorMocks('plan', LagoApiError.FeatureUnavailable))

        expect(await screen.findByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the error is not a premium limitation', () => {
      it('THEN renders the error placeholder with a retry button', async () => {
        renderComponent('plan', buildErrorMocks('plan', LagoApiError.InternalError))

        expect(await screen.findByTestId(GENERIC_PLACEHOLDER_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the logs cannot be viewed', () => {
    describe.each([
      ['the user is not premium', { isPremium: false, granted: ['auditLogsView'] }],
      ['the user lacks the auditLogsView permission', { isPremium: true, granted: [] }],
    ])('WHEN %s', (_, { isPremium, granted }) => {
      it('THEN skips the query and renders the empty state', async () => {
        const result = jest.fn(buildResult)

        mockIsPremium.mockReturnValue(isPremium)
        grantPermissions(granted)

        renderComponent('plan', anyQueryMocks(result))

        expect(await screen.findByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        await waitFor(() => {
          expect(result).not.toHaveBeenCalled()
        })
        expect(screen.queryByText(ACTIVITY_DESCRIPTION)).not.toBeInTheDocument()
      })
    })
  })
})
