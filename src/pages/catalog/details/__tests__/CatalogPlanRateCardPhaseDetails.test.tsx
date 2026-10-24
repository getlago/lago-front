import { MockedResponse } from '@apollo/client/testing'
import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'

import {
  APPLIED_RATE_CARD_ID,
  buildPlanAppliedRateCard,
  CATALOG_PLAN_ID,
  FINITE_PHASE,
  FOREVER_PHASE,
} from '~/components/appliedRateCards/details/__tests__/fixtures'
import {
  APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
  RATE_PHASE_NOT_FOUND_TRANSLATION_KEY,
} from '~/components/appliedRateCards/details/appliedRateCardDetailsConfig'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'
import { addToast } from '~/core/apolloClient'
import {
  GetPlanAppliedRateCardForDetailsDocument,
  PlanAppliedRateCardForDetailsFragment,
} from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import CatalogPlanRateCardPhaseDetails from '../CatalogPlanRateCardPhaseDetails'

// Every test mounts the whole page, so the default 5s budget is tight under parallel jest.
jest.setTimeout(15000)

const mockHasPermissions = jest.fn()

jest.mock('~/components/appliedRateCards/drawers/ratePhase/useRatePhaseDrawer', () => ({
  useRatePhaseDrawer: () => ({ openDrawer: jest.fn() }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useDeleteRatePhaseDialog', () => ({
  useDeleteRatePhaseDialog: () => ({ openDeleteRatePhaseDialog: jest.fn() }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useResetRatePhaseOverrideDialog', () => ({
  useResetRatePhaseOverrideDialog: () => ({ openResetRatePhaseOverrideDialog: jest.fn() }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const PLAN_RATE_CARDS_SECTION_PATH = `/plan-pricing/${CATALOG_PLAN_ID}/overview/rate-cards`
const CARD_OVERVIEW_PATH = `/plan-pricing/${CATALOG_PLAN_ID}/rate-cards/${APPLIED_RATE_CARD_ID}/overview`

const detailsQueryMock = (card: PlanAppliedRateCardForDetailsFragment): MockedResponse => ({
  request: {
    query: GetPlanAppliedRateCardForDetailsDocument,
    variables: { appliedRateCardId: APPLIED_RATE_CARD_ID },
  },
  result: { data: { planAppliedRateCard: card } },
})

const notFoundQueryMock: MockedResponse = {
  request: {
    query: GetPlanAppliedRateCardForDetailsDocument,
    variables: { appliedRateCardId: APPLIED_RATE_CARD_ID },
  },
  result: {
    errors: [{ message: 'Resource not found', extensions: { code: 'not_found' } }],
  },
}

const PageWithHeader = (): JSX.Element => (
  <>
    <MainHeader />
    <CatalogPlanRateCardPhaseDetails />
  </>
)

const renderPage = async (mocks: MockedResponse[]): Promise<void> => {
  await act(() =>
    rtlRender(<PageWithHeader />, {
      wrapper: ({ children }) => (
        <AllTheProviders
          forceTypenames
          mocks={mocks}
          useParams={{
            catalogPlanId: CATALOG_PLAN_ID,
            appliedRateCardId: APPLIED_RATE_CARD_ID,
            phaseId: FINITE_PHASE.id,
          }}
        >
          {children}
        </AllTheProviders>
      ),
    }),
  )
}

const expectRedirect = async (path: string, translateKey: string): Promise<void> => {
  await waitFor(() => expect(testMockNavigateFn).toHaveBeenCalledWith(path, { replace: true }))
  expect(testMockNavigateFn).toHaveBeenCalledTimes(1)
  expect(addToast).toHaveBeenCalledTimes(1)
  expect(addToast).toHaveBeenCalledWith({ severity: 'info', translateKey })
}

describe('CatalogPlanRateCardPhaseDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN a card holding the URL phase', () => {
    it('THEN renders the phase title', async () => {
      await renderPage([detailsQueryMock(buildPlanAppliedRateCard())])

      await waitFor(() =>
        expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
          'Ramp up',
        ),
      )
      expect(testMockNavigateFn).not.toHaveBeenCalled()
      expect(addToast).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the URL phase is not on the card', () => {
    it('THEN redirects to the card overview with the phase not found toast', async () => {
      await renderPage([
        detailsQueryMock(
          buildPlanAppliedRateCard({ ratePhases: [FOREVER_PHASE], ratePhasesCount: 1 }),
        ),
      ])

      await expectRedirect(CARD_OVERVIEW_PATH, RATE_PHASE_NOT_FOUND_TRANSLATION_KEY)
    })
  })

  describe('GIVEN the card belongs to another plan than the URL', () => {
    it("THEN redirects to the URL plan's rate cards section with the rate card not found toast", async () => {
      await renderPage([
        detailsQueryMock(
          buildPlanAppliedRateCard({
            catalogPlan: {
              ...buildPlanAppliedRateCard().catalogPlan,
              id: 'other-catalog-plan',
            },
          }),
        ),
      ])

      await expectRedirect(
        PLAN_RATE_CARDS_SECTION_PATH,
        APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
      )
    })
  })

  describe('GIVEN the card does not exist', () => {
    it('THEN redirects the same way', async () => {
      await renderPage([notFoundQueryMock])

      await expectRedirect(
        PLAN_RATE_CARDS_SECTION_PATH,
        APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
      )
    })
  })
})
