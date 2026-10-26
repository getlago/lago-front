import { render as rtlRender, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentProps } from 'react'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { BREADCRUMB_NAV_TEST_ID } from '~/components/MainHeader/Breadcrumb'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '~/components/MainHeader/mainHeaderTestIds'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import {
  APPLIED_RATE_CARD_ID,
  buildContractAppliedRateCard,
  buildPlanAppliedRateCard,
  CATALOG_PLAN_ID,
  CONTRACT_ID,
  FINITE_PHASE,
  FOREVER_PHASE,
} from './fixtures'

import {
  APPLIED_RATE_CARD_OVERVIEW_ADD_PHASE_TEST_ID,
  APPLIED_RATE_CARD_OVERVIEW_CODE_TEST_ID,
  APPLIED_RATE_CARD_OVERVIEW_EFFECTIVE_DATE_TEST_ID,
  APPLIED_RATE_CARD_OVERVIEW_NAME_TEST_ID,
  APPLIED_RATE_CARD_OVERVIEW_RELATIONS_TEST_ID,
  APPLIED_RATE_CARD_OVERVIEW_TEST_ID,
  APPLIED_RATE_CARD_OVERVIEW_UNITS_TEST_ID,
} from '../AppliedRateCardDetailsOverview'
import {
  APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID,
  APPLIED_RATE_CARD_DETAILS_ACTIVITY_LOGS_TAB_TEST_ID,
  APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID,
  APPLIED_RATE_CARD_DETAILS_OVERVIEW_TAB_TEST_ID,
  APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID,
  AppliedRateCardDetailsView,
} from '../AppliedRateCardDetailsView'
import {
  APPLIED_RATE_CARD_PHASE_NAME_TEST_ID,
  getAppliedRateCardPhaseRowTestId,
} from '../AppliedRateCardPhasesTable'
import { AppliedRateCardDetailsData } from '../types'

// Every test mounts the header and the whole overview, so the default 5s budget is tight.
jest.setTimeout(15000)

const mockOpenRatePhaseDrawer = jest.fn()
const mockOpenRemoveDialog = jest.fn()
const mockHasPermissions = jest.fn()
let mockIsPremium = true

jest.mock('~/components/appliedRateCards/drawers/ratePhase/useRatePhaseDrawer', () => ({
  useRatePhaseDrawer: () => ({ openDrawer: mockOpenRatePhaseDrawer }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useDeleteRatePhaseDialog', () => ({
  useDeleteRatePhaseDialog: () => ({ openDeleteRatePhaseDialog: jest.fn() }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useResetRatePhaseOverrideDialog', () => ({
  useResetRatePhaseOverrideDialog: () => ({ openResetRatePhaseOverrideDialog: jest.fn() }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useRemoveAppliedRateCardDialog', () => ({
  useRemoveAppliedRateCardDialog: () => ({
    openRemoveAppliedRateCardDialog: mockOpenRemoveDialog,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const PLAN_DATA: AppliedRateCardDetailsData = {
  context: 'plan',
  parent: { id: CATALOG_PLAN_ID, name: 'Enterprise plan', isLocked: false },
  appliedRateCard: buildPlanAppliedRateCard(),
}

const CONTRACT_DATA: AppliedRateCardDetailsData = {
  context: 'contract',
  parent: { id: CONTRACT_ID, name: 'Acme contract', isLocked: false },
  appliedRateCard: buildContractAppliedRateCard(),
}

const withLockedParent = (data: AppliedRateCardDetailsData): AppliedRateCardDetailsData => ({
  ...data,
  parent: { ...data.parent, isLocked: true },
})

type ViewProps = ComponentProps<typeof AppliedRateCardDetailsView>

const ViewWithHeader = (props: ViewProps): JSX.Element => (
  <>
    <MainHeader />
    <AppliedRateCardDetailsView {...props} />
  </>
)

const getLoadedViewProps = (data: AppliedRateCardDetailsData): ViewProps => ({
  context: data.context,
  data,
  loading: false,
  hasError: false,
})

const renderWithHeader = (props: ViewProps): ReturnType<typeof rtlRender> =>
  rtlRender(<ViewWithHeader {...props} />, {
    wrapper: ({ children }) => <AllTheProviders>{children}</AllTheProviders>,
  })

const renderView = (data: AppliedRateCardDetailsData): ReturnType<typeof rtlRender> =>
  renderWithHeader(getLoadedViewProps(data))

const getBreadcrumbLinks = (): HTMLElement[] =>
  within(screen.getAllByTestId(BREADCRUMB_NAV_TEST_ID)[0]).getAllByRole('link')

const openActions = async (): Promise<void> => {
  await userEvent.click(
    (await screen.findAllByTestId(APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID))[0],
  )
}

describe('AppliedRateCardDetailsView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium = true
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN a plan card', () => {
    it('THEN shows relations, rate card name and code, units, and no effective date', async () => {
      renderView(PLAN_DATA)

      const relations = await screen.findByTestId(APPLIED_RATE_CARD_OVERVIEW_RELATIONS_TEST_ID)

      expect(relations).toHaveTextContent('Platform')
      expect(relations).toHaveTextContent('API calls')
      expect(relations).toHaveTextContent('EU region')
      expect(screen.getByTestId(APPLIED_RATE_CARD_OVERVIEW_NAME_TEST_ID)).toHaveTextContent(
        'Standard rate card',
      )
      expect(screen.getByTestId(APPLIED_RATE_CARD_OVERVIEW_CODE_TEST_ID)).toHaveTextContent(
        'standard_rate_card',
      )
      expect(screen.getByTestId(APPLIED_RATE_CARD_OVERVIEW_UNITS_TEST_ID)).toHaveTextContent(/^12$/)
      expect(
        screen.queryByTestId(APPLIED_RATE_CARD_OVERVIEW_EFFECTIVE_DATE_TEST_ID),
      ).not.toBeInTheDocument()
      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_ACTIVITY_LOGS_TAB_TEST_ID)).toBeVisible()
    })

    it('THEN shows the card in the header and links the parent crumb to its rate cards section', async () => {
      renderView(PLAN_DATA)

      await waitFor(() =>
        expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
          'Standard rate card',
        ),
      )
      expect(screen.getAllByTestId(ENTITY_SECTION_METADATA_TEST_ID)[0]).toHaveTextContent(
        'standard_rate_card',
      )

      const crumbLinks = getBreadcrumbLinks()

      expect(crumbLinks.map((link) => link.getAttribute('href'))).toEqual([
        '/plan-pricing',
        `/plan-pricing/${CATALOG_PLAN_ID}/overview/rate-cards`,
      ])
      expect(crumbLinks[1]).toHaveTextContent('Enterprise plan')
    })

    it('THEN links each phase row to its phase page', async () => {
      renderView(PLAN_DATA)

      const row = await screen.findByTestId(getAppliedRateCardPhaseRowTestId(1))

      expect(within(row).getByRole('link', { name: 'Ramp up' })).toHaveAttribute(
        'href',
        `/plan-pricing/${CATALOG_PLAN_ID}/rate-cards/${APPLIED_RATE_CARD_ID}/phases/${FINITE_PHASE.id}`,
      )
    })

    it('GIVEN no units THEN shows a dash', async () => {
      renderView({ ...PLAN_DATA, appliedRateCard: buildPlanAppliedRateCard({ units: null }) })

      expect(await screen.findByTestId(APPLIED_RATE_CARD_OVERVIEW_UNITS_TEST_ID)).toHaveTextContent(
        /^-$/,
      )
    })
  })

  describe('GIVEN a contract card', () => {
    it('THEN also shows the effective date, as a calendar day in UTC', async () => {
      renderView(CONTRACT_DATA)

      expect(
        await screen.findByTestId(APPLIED_RATE_CARD_OVERVIEW_EFFECTIVE_DATE_TEST_ID),
      ).toHaveTextContent('Mar 1, 2026')

      const crumbLinks = getBreadcrumbLinks()

      expect(crumbLinks.map((link) => link.getAttribute('href'))).toEqual([
        '/contracts',
        `/contracts/${CONTRACT_ID}/overview/rate-cards`,
      ])
      expect(crumbLinks[1]).toHaveTextContent('Acme contract')
    })
  })

  describe('GIVEN an unlocked parent', () => {
    describe('WHEN "Create a rate phase" is used', () => {
      it('THEN opens the phase drawer in create mode for this card', async () => {
        renderView(PLAN_DATA)

        await openActions()
        await userEvent.click(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID))

        expect(mockOpenRatePhaseDrawer).toHaveBeenCalledWith(
          expect.objectContaining({
            context: 'plan',
            mode: 'create',
            planAppliedRateCardId: APPLIED_RATE_CARD_ID,
          }),
        )
      })
    })

    describe('WHEN "Remove rate card" succeeds', () => {
      it('THEN returns to the parent rate cards section', async () => {
        renderView(CONTRACT_DATA)

        await openActions()
        await userEvent.click(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID))

        expect(mockOpenRemoveDialog).toHaveBeenCalledWith(
          expect.objectContaining({
            context: 'contract',
            id: APPLIED_RATE_CARD_ID,
            rateCardName: 'Standard rate card',
          }),
        )

        mockOpenRemoveDialog.mock.calls[0][0].onRemoved()

        expect(testMockNavigateFn).toHaveBeenCalledWith(
          `/contracts/${CONTRACT_ID}/overview/rate-cards`,
        )
      })
    })
  })

  describe('GIVEN a locked parent', () => {
    it('THEN create and remove are disabled', async () => {
      renderView(withLockedParent(PLAN_DATA))

      expect(await screen.findByTestId(APPLIED_RATE_CARD_OVERVIEW_ADD_PHASE_TEST_ID)).toBeDisabled()

      await openActions()

      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID)).toBeDisabled()
      expect(screen.getByTestId(APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID)).toBeDisabled()
    })
  })

  describe('GIVEN no update permission', () => {
    it('THEN create and remove are hidden', async () => {
      mockHasPermissions.mockImplementation(
        (permissions: string[]) => !permissions.includes('plansUpdate'),
      )

      renderView(PLAN_DATA)

      await screen.findByTestId(APPLIED_RATE_CARD_OVERVIEW_TEST_ID)

      expect(
        screen.queryByTestId(APPLIED_RATE_CARD_OVERVIEW_ADD_PHASE_TEST_ID),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId(APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID),
      ).not.toBeInTheDocument()
    })
  })

  describe('GIVEN no premium', () => {
    it('THEN the activity logs tab is hidden', async () => {
      mockIsPremium = false

      renderView(PLAN_DATA)

      expect(
        await screen.findByTestId(APPLIED_RATE_CARD_DETAILS_OVERVIEW_TAB_TEST_ID),
      ).toBeVisible()
      expect(
        screen.queryByTestId(APPLIED_RATE_CARD_DETAILS_ACTIVITY_LOGS_TAB_TEST_ID),
      ).not.toBeInTheDocument()
    })
  })

  describe('GIVEN a URL tab that is not a known tab', () => {
    // `/rate-cards/:id/phases` (no phase id) matches the `/:tab` route with tab=phases.
    it('THEN renders the overview tab', async () => {
      window.history.pushState(
        {},
        '',
        `/plan-pricing/${CATALOG_PLAN_ID}/rate-cards/${APPLIED_RATE_CARD_ID}/phases`,
      )

      renderView(PLAN_DATA)

      expect(await screen.findByTestId(APPLIED_RATE_CARD_OVERVIEW_TEST_ID)).toBeInTheDocument()
    })
  })

  describe.each([
    { context: 'plan' as const, rootPath: '/plan-pricing' },
    { context: 'contract' as const, rootPath: '/contracts' },
  ])('GIVEN a $context card that is still loading', ({ context, rootPath }) => {
    it('THEN keeps the root crumb and skeletons the parent crumb, with no error', async () => {
      renderWithHeader({ context, data: undefined, loading: true, hasError: false })

      await waitFor(() =>
        expect(getBreadcrumbLinks().map((link) => link.getAttribute('href'))).toEqual([rootPath]),
      )
      expect(screen.getAllByTestId(BREADCRUMB_NAV_TEST_ID)[0]).toHaveTextContent(
        'text_17902866782060xpq8p9bh3a',
      )
      expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the card failed to load with an error other than not found', () => {
    it('THEN shows the error state under the root crumb', async () => {
      renderWithHeader({ context: 'plan', data: undefined, loading: false, hasError: true })

      expect(await screen.findByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
      expect(getBreadcrumbLinks().map((link) => link.getAttribute('href'))).toEqual([
        '/plan-pricing',
      ])
    })
  })

  describe('GIVEN the card is refetched with a renamed phase', () => {
    // The header only re-pushes its tabs when the snapshot key moves, so a key missing the
    // phase fields would keep showing the old name.
    it('THEN the phases table shows the new name', async () => {
      const { rerender } = renderView(PLAN_DATA)

      const row = await screen.findByTestId(getAppliedRateCardPhaseRowTestId(1))

      expect(within(row).getByTestId(APPLIED_RATE_CARD_PHASE_NAME_TEST_ID)).toHaveTextContent(
        'Ramp up',
      )

      rerender(
        <ViewWithHeader
          {...getLoadedViewProps({
            ...PLAN_DATA,
            appliedRateCard: buildPlanAppliedRateCard({
              ratePhases: [{ ...FINITE_PHASE, name: 'Warm up' }, FOREVER_PHASE],
            }),
          })}
        />,
      )

      await waitFor(() =>
        expect(
          within(screen.getByTestId(getAppliedRateCardPhaseRowTestId(1))).getByTestId(
            APPLIED_RATE_CARD_PHASE_NAME_TEST_ID,
          ),
        ).toHaveTextContent('Warm up'),
      )
    })
  })
})
