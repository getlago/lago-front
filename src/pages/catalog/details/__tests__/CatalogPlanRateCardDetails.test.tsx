import { MockedResponse } from '@apollo/client/testing'
import { act, render as rtlRender, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  APPLIED_RATE_CARD_ID,
  buildPlanAppliedRateCard,
  CATALOG_PLAN_ID,
} from '~/components/appliedRateCards/details/__tests__/fixtures'
import { APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY } from '~/components/appliedRateCards/details/appliedRateCardDetailsConfig'
import {
  APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID,
  APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID,
  APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID,
} from '~/components/appliedRateCards/details/AppliedRateCardDetailsView'
import { BREADCRUMB_NAV_TEST_ID } from '~/components/MainHeader/Breadcrumb'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { ENTITY_SECTION_VIEW_NAME_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'
import { addToast } from '~/core/apolloClient'
import {
  GetPlanAppliedRateCardForDetailsDocument,
  PlanAppliedRateCardForDetailsFragment,
} from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import CatalogPlanRateCardDetails from '../CatalogPlanRateCardDetails'

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

jest.mock('~/components/appliedRateCards/dialogs/useRemoveAppliedRateCardDialog', () => ({
  useRemoveAppliedRateCardDialog: () => ({ openRemoveAppliedRateCardDialog: jest.fn() }),
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
    <CatalogPlanRateCardDetails />
  </>
)

const renderPage = async (mocks: MockedResponse[]): Promise<void> => {
  await act(() =>
    rtlRender(<PageWithHeader />, {
      wrapper: ({ children }) => (
        <AllTheProviders
          forceTypenames
          mocks={mocks}
          useParams={{ catalogPlanId: CATALOG_PLAN_ID, appliedRateCardId: APPLIED_RATE_CARD_ID }}
        >
          {children}
        </AllTheProviders>
      ),
    }),
  )
}

const expectNotFoundRedirect = async (): Promise<void> => {
  await waitFor(() =>
    expect(testMockNavigateFn).toHaveBeenCalledWith(PLAN_RATE_CARDS_SECTION_PATH, {
      replace: true,
    }),
  )
  expect(addToast).toHaveBeenCalledWith({
    severity: 'info',
    translateKey: APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
  })
}

describe('CatalogPlanRateCardDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN a card of the URL plan', () => {
    it('THEN shows the card with its plan as the parent crumb', async () => {
      await renderPage([detailsQueryMock(buildPlanAppliedRateCard())])

      await waitFor(() =>
        expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
          'Standard rate card',
        ),
      )

      const parentCrumb = within(screen.getAllByTestId(BREADCRUMB_NAV_TEST_ID)[0]).getAllByRole(
        'link',
      )[1]

      expect(parentCrumb).toHaveTextContent('Enterprise plan')
      expect(parentCrumb).toHaveAttribute('href', PLAN_RATE_CARDS_SECTION_PATH)
      expect(testMockNavigateFn).not.toHaveBeenCalled()

      await userEvent.click(screen.getAllByTestId(APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID)[0])

      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID)).not.toBeDisabled()
      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID)).not.toBeDisabled()
    })
  })

  describe('GIVEN the plan is attached to contracts', () => {
    it('THEN create and remove are disabled', async () => {
      await renderPage([
        detailsQueryMock(
          buildPlanAppliedRateCard({
            catalogPlan: {
              __typename: 'CatalogPlan',
              id: CATALOG_PLAN_ID,
              name: 'Enterprise plan',
              attachedToContracts: true,
            },
          }),
        ),
      ])

      await userEvent.click(
        (await screen.findAllByTestId(APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID))[0],
      )

      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID)).toBeDisabled()
      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID)).toBeDisabled()
    })
  })

  describe('GIVEN the card belongs to another plan than the URL', () => {
    it("THEN redirects to the URL plan's rate cards section with the not found toast", async () => {
      await renderPage([
        detailsQueryMock(
          buildPlanAppliedRateCard({
            catalogPlan: {
              __typename: 'CatalogPlan',
              id: 'other-catalog-plan',
              name: 'Other plan',
              attachedToContracts: false,
            },
          }),
        ),
      ])

      await expectNotFoundRedirect()
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).not.toHaveTextContent(
        'Standard rate card',
      )
    })
  })

  describe('GIVEN the card does not exist', () => {
    it('THEN redirects the same way', async () => {
      await renderPage([notFoundQueryMock])

      await expectNotFoundRedirect()
    })
  })
})
