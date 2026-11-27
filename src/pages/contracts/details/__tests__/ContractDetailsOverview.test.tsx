import { render, RenderResult, screen, waitFor } from '@testing-library/react'

import { GetContractAlertsCountForOverviewNavDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { ContractDetailsOverview } from '../ContractDetailsOverview'

const OVERVIEW_SECTION_TEST_ID = 'mock-overview-section'
const ALERTS_SECTION_TEST_ID = 'mock-alerts-section'

const mockHasFeatureFlag = jest.fn()
const mockNavProps = jest.fn()
const mockAlertsSectionProps = jest.fn()
let mockIsPremium = true
let mockSection = 'alerts'

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ id: 'contract-1', section: mockSection }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ hasFeatureFlag: mockHasFeatureFlag }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('../ContractOverviewNav', () => ({
  ContractOverviewNav: (props: Record<string, unknown>) => {
    mockNavProps(props)

    return null
  },
}))

jest.mock('../ContractOverviewSection', () => ({
  ContractOverviewSection: () => <div data-test="mock-overview-section" />,
}))

jest.mock('../ContractRateCardsSection', () => ({
  ContractRateCardsSection: () => null,
}))

jest.mock('../ContractAlertsSection', () => ({
  ContractAlertsSection: (props: Record<string, unknown>) => {
    mockAlertsSectionProps(props)

    return <div data-test="mock-alerts-section" />
  },
}))

const buildCountMock = (onRequest: jest.Mock): TestMocksType[number] => ({
  request: {
    query: GetContractAlertsCountForOverviewNavDocument,
    variables: { contractId: 'contract-1' },
  },
  result: () => {
    onRequest()

    return {
      data: {
        contractAlerts: {
          __typename: 'ContractAlertCollection',
          metadata: { __typename: 'CollectionMetadata', totalCount: 7 },
        },
      },
    }
  },
})

const renderOverview = (mocks: TestMocksType, { isAlertsReadOnly = false } = {}): RenderResult =>
  render(
    <AllTheProviders mocks={mocks}>
      <ContractDetailsOverview
        currency={undefined}
        isRateCardsLocked={false}
        isAlertsReadOnly={isAlertsReadOnly}
      />
    </AllTheProviders>,
  )

const flushRequests = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

describe('ContractDetailsOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPremium = true
    mockSection = 'alerts'
  })

  describe('GIVEN the contract_alerts flag is off', () => {
    describe('WHEN the alerts section is requested by URL', () => {
      it('THEN should fall back to the overview section and skip the count query', async () => {
        mockHasFeatureFlag.mockReturnValue(false)
        const onRequest = jest.fn()

        renderOverview([buildCountMock(onRequest)])

        expect(screen.getByTestId(OVERVIEW_SECTION_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(ALERTS_SECTION_TEST_ID)).not.toBeInTheDocument()
        expect(mockNavProps).toHaveBeenLastCalledWith(
          expect.objectContaining({ isAlertsEnabled: false, activeSection: 'contract-overview' }),
        )

        await flushRequests()
        expect(onRequest).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the contract_alerts flag is on', () => {
    beforeEach(() => {
      mockHasFeatureFlag.mockReturnValue(true)
    })

    describe('WHEN the user is premium', () => {
      it('THEN should render the alerts section and pass the count to the nav', async () => {
        const onRequest = jest.fn()

        renderOverview([buildCountMock(onRequest)])

        expect(screen.getByTestId(ALERTS_SECTION_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(OVERVIEW_SECTION_TEST_ID)).not.toBeInTheDocument()

        await waitFor(() =>
          expect(mockNavProps).toHaveBeenLastCalledWith(
            expect.objectContaining({ isAlertsEnabled: true, alertsCount: 7 }),
          ),
        )
        expect(onRequest).toHaveBeenCalled()
      })
    })

    describe('WHEN the user is not premium', () => {
      it('THEN should skip the count query', async () => {
        mockIsPremium = false
        const onRequest = jest.fn()

        renderOverview([buildCountMock(onRequest)])

        await flushRequests()
        expect(onRequest).not.toHaveBeenCalled()
        expect(mockNavProps).toHaveBeenLastCalledWith(
          expect.objectContaining({ alertsCount: undefined }),
        )
      })
    })

    describe('WHEN the contract alerts are read-only', () => {
      it('THEN should forward isReadOnly to the alerts section', () => {
        renderOverview([buildCountMock(jest.fn())], { isAlertsReadOnly: true })

        expect(mockAlertsSectionProps).toHaveBeenLastCalledWith(
          expect.objectContaining({ contractId: 'contract-1', isReadOnly: true }),
        )
      })
    })
  })
})
