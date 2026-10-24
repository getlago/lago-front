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
import { AppliedRateCardDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CONTRACTS_ROUTE, PLAN_PRICING_ROUTE } from '~/core/router'
import {
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RatePhaseForDrawerFragment,
} from '~/generated/graphql'
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

import { APPLIED_RATE_CARD_DETAILS_CONFIG } from '../appliedRateCardDetailsConfig'
import {
  RATE_PHASE_OVERVIEW_EDIT_TEST_ID,
  RATE_PHASE_OVERVIEW_TEST_ID,
} from '../RatePhaseDetailsOverview'
import {
  RATE_PHASE_DETAILS_ACTIONS_TEST_ID,
  RATE_PHASE_DETAILS_ACTIVITY_LOGS_EMPTY_TEST_ID,
  RATE_PHASE_DETAILS_ACTIVITY_LOGS_TAB_TEST_ID,
  RATE_PHASE_DETAILS_OVERVIEW_TAB_TEST_ID,
  RatePhaseDetailsView,
} from '../RatePhaseDetailsView'
import { AppliedRateCardDetailsData } from '../types'
import {
  RATE_PHASE_ACTION_COPY_TEST_ID,
  RATE_PHASE_ACTION_DELETE_TEST_ID,
  RATE_PHASE_ACTION_EDIT_TEST_ID,
  RATE_PHASE_ACTION_RESET_TEST_ID,
} from '../useRatePhaseActions'

// Every test mounts the header and the whole overview, so the default 5s budget is tight.
jest.setTimeout(15000)

const mockOpenRatePhaseDrawer = jest.fn()
const mockOpenDeleteDialog = jest.fn()
const mockHasPermissions = jest.fn()
let mockIsPremium = true

jest.mock('~/components/appliedRateCards/drawers/ratePhase/useRatePhaseDrawer', () => ({
  useRatePhaseDrawer: () => ({ openDrawer: mockOpenRatePhaseDrawer }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useDeleteRatePhaseDialog', () => ({
  useDeleteRatePhaseDialog: () => ({ openDeleteRatePhaseDialog: mockOpenDeleteDialog }),
}))

jest.mock('~/components/appliedRateCards/dialogs/useResetRatePhaseOverrideDialog', () => ({
  useResetRatePhaseOverrideDialog: () => ({ openResetRatePhaseOverrideDialog: jest.fn() }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

const OVERRIDDEN_FINITE_PHASE: RatePhaseForDrawerFragment = {
  ...FINITE_PHASE,
  rateOverride: {
    __typename: 'RateOverride',
    rateModel: RateCardRateModelEnum.Standard,
    billingIntervalCount: 1,
    billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
    minAmountCents: '0',
    pricingUnitConversionRate: null,
    rateProperties: { __typename: 'RateProperties', amount: '25' },
  },
}

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

type ViewProps = ComponentProps<typeof RatePhaseDetailsView>

const ViewWithHeader = (props: ViewProps): JSX.Element => (
  <>
    <MainHeader />
    <RatePhaseDetailsView {...props} />
  </>
)

const getLoadedViewProps = (
  data: AppliedRateCardDetailsData,
  phaseId: string = FINITE_PHASE.id,
): ViewProps => ({
  context: data.context,
  data,
  phaseId,
  loading: false,
  hasError: false,
})

const renderWithHeader = (props: ViewProps): ReturnType<typeof rtlRender> =>
  rtlRender(<ViewWithHeader {...props} />, {
    wrapper: ({ children }) => <AllTheProviders>{children}</AllTheProviders>,
  })

const renderView = (
  data: AppliedRateCardDetailsData,
  phaseId: string = FINITE_PHASE.id,
): ReturnType<typeof rtlRender> => renderWithHeader(getLoadedViewProps(data, phaseId))

const getBreadcrumbLinks = (): HTMLElement[] =>
  within(screen.getAllByTestId(BREADCRUMB_NAV_TEST_ID)[0]).getAllByRole('link')

const getViewName = (): HTMLElement => screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]

const getMetadata = (): HTMLElement => screen.getAllByTestId(ENTITY_SECTION_METADATA_TEST_ID)[0]

const openActions = async (): Promise<void> => {
  await userEvent.click((await screen.findAllByTestId(RATE_PHASE_DETAILS_ACTIONS_TEST_ID))[0])
}

describe('RatePhaseDetailsView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium = true
    window.history.pushState({}, '', '/')
  })

  describe.each([
    { context: 'plan', data: PLAN_DATA, rootPath: PLAN_PRICING_ROUTE },
    { context: 'contract', data: CONTRACT_DATA, rootPath: CONTRACTS_ROUTE },
  ])('GIVEN a phase of a $context card', ({ data, rootPath }) => {
    it('THEN the breadcrumb links root, parent rate cards section and the card page, then "Phase"', async () => {
      const config = APPLIED_RATE_CARD_DETAILS_CONFIG[data.context]

      renderView(data)

      await waitFor(() =>
        expect(getBreadcrumbLinks().map((link) => link.getAttribute('href'))).toEqual([
          rootPath,
          config.buildParentRateCardsPath(data.parent.id),
          config.buildCardPath({
            parentId: data.parent.id,
            appliedRateCardId: APPLIED_RATE_CARD_ID,
          }),
        ]),
      )
      expect(getBreadcrumbLinks()[1]).toHaveTextContent(data.parent.name)
      expect(getBreadcrumbLinks()[2]).toHaveTextContent('standard_rate_card')
      expect(screen.getAllByTestId(BREADCRUMB_NAV_TEST_ID)[0]).toHaveTextContent(
        'text_1790286678206xilydvk4a1n',
      )
    })
  })

  describe('GIVEN a named phase', () => {
    it('THEN the title is its name and the metadata its position', async () => {
      renderView(PLAN_DATA)

      await waitFor(() => expect(getViewName()).toHaveTextContent('Ramp up'))
      expect(getMetadata()).toHaveTextContent('text_1792807216284omzlpv8edip|1')
      expect(await screen.findByTestId(RATE_PHASE_OVERVIEW_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('GIVEN an unnamed phase', () => {
    it('THEN the title falls back to the position key', async () => {
      renderView({
        ...PLAN_DATA,
        appliedRateCard: buildPlanAppliedRateCard({
          ratePhases: [{ ...FINITE_PHASE, name: null }, FOREVER_PHASE],
        }),
      })

      await waitFor(() =>
        expect(getViewName()).toHaveTextContent('text_1792503533806fhiu57zr6an|1'),
      )
    })
  })

  describe('GIVEN an unlocked card and an overridden phase', () => {
    it('THEN the menu lists copy, edit, reset, delete', async () => {
      renderView({
        ...PLAN_DATA,
        appliedRateCard: buildPlanAppliedRateCard({
          ratePhases: [OVERRIDDEN_FINITE_PHASE, FOREVER_PHASE],
        }),
      })

      await openActions()

      expect(screen.getByTestId(RATE_PHASE_ACTION_COPY_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(RATE_PHASE_ACTION_EDIT_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(RATE_PHASE_ACTION_RESET_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(RATE_PHASE_ACTION_DELETE_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('GIVEN a locked parent', () => {
    it('THEN the menu lists copy only and the inline edit is disabled', async () => {
      renderView(withLockedParent(CONTRACT_DATA))

      expect(await screen.findByTestId(RATE_PHASE_OVERVIEW_EDIT_TEST_ID)).toBeDisabled()

      await openActions()

      expect(screen.getByTestId(RATE_PHASE_ACTION_COPY_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(RATE_PHASE_ACTION_EDIT_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(RATE_PHASE_ACTION_RESET_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(RATE_PHASE_ACTION_DELETE_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN a phase deleted from the page', () => {
    it('THEN navigates to the card overview', async () => {
      renderView(PLAN_DATA)

      await openActions()
      await userEvent.click(screen.getByTestId(RATE_PHASE_ACTION_DELETE_TEST_ID))

      expect(mockOpenDeleteDialog).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'plan', appliedRateCardId: APPLIED_RATE_CARD_ID }),
      )

      mockOpenDeleteDialog.mock.calls[0][0].onDeleted()

      expect(testMockNavigateFn).toHaveBeenCalledWith(
        APPLIED_RATE_CARD_DETAILS_CONFIG.plan.buildCardPath({
          parentId: CATALOG_PLAN_ID,
          appliedRateCardId: APPLIED_RATE_CARD_ID,
          tab: AppliedRateCardDetailsTabsOptionsEnum.overview,
        }),
      )
    })
  })

  describe('GIVEN premium and audit logs permission', () => {
    describe('WHEN the activity logs tab opens', () => {
      it('THEN shows the not available yet subtitle', async () => {
        renderView(PLAN_DATA)

        await userEvent.click(
          await screen.findByTestId(RATE_PHASE_DETAILS_ACTIVITY_LOGS_TAB_TEST_ID),
        )

        expect(
          await screen.findByTestId(RATE_PHASE_DETAILS_ACTIVITY_LOGS_EMPTY_TEST_ID),
        ).toHaveTextContent('text_1792807216284fcthmczmbad')
        expect(screen.queryByTestId(RATE_PHASE_OVERVIEW_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no premium', () => {
    it('THEN the activity logs tab is hidden', async () => {
      mockIsPremium = false

      renderView(PLAN_DATA)

      expect(await screen.findByTestId(RATE_PHASE_DETAILS_OVERVIEW_TAB_TEST_ID)).toBeVisible()
      expect(
        screen.queryByTestId(RATE_PHASE_DETAILS_ACTIVITY_LOGS_TAB_TEST_ID),
      ).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the same card', () => {
    describe('WHEN phaseId changes', () => {
      it('THEN the title follows', async () => {
        const { rerender } = renderView(PLAN_DATA, FINITE_PHASE.id)

        await waitFor(() => expect(getViewName()).toHaveTextContent('Ramp up'))

        rerender(<ViewWithHeader {...getLoadedViewProps(PLAN_DATA, FOREVER_PHASE.id)} />)

        await waitFor(() => expect(getViewName()).toHaveTextContent('Steady'))
        expect(getMetadata()).toHaveTextContent('text_1792807216284omzlpv8edip|2')
        expect(screen.getByTestId(RATE_PHASE_OVERVIEW_TEST_ID)).toHaveTextContent('steady')

        await openActions()
        await userEvent.click(screen.getByTestId(RATE_PHASE_ACTION_EDIT_TEST_ID))

        expect(mockOpenRatePhaseDrawer).toHaveBeenCalledWith(
          expect.objectContaining({ mode: 'edit', phase: FOREVER_PHASE }),
        )
      })
    })
  })

  describe('GIVEN a phase id that is not on the card', () => {
    it('THEN renders neither the phase nor an error', async () => {
      renderView(PLAN_DATA, 'unknown-phase')

      await waitFor(() =>
        expect(getBreadcrumbLinks().map((link) => link.getAttribute('href'))).toEqual([
          PLAN_PRICING_ROUTE,
        ]),
      )
      expect(screen.queryByTestId(RATE_PHASE_OVERVIEW_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN loading', () => {
    it('THEN the skeleton renders', async () => {
      renderWithHeader({
        context: 'plan',
        data: undefined,
        phaseId: FINITE_PHASE.id,
        loading: true,
        hasError: false,
      })

      await waitFor(() =>
        expect(getBreadcrumbLinks().map((link) => link.getAttribute('href'))).toEqual([
          PLAN_PRICING_ROUTE,
        ]),
      )
      expect(screen.getAllByTestId(BREADCRUMB_NAV_TEST_ID)[0]).toHaveTextContent(
        'text_1790286678206xilydvk4a1n',
      )
      expect(screen.queryByTestId(RATE_PHASE_OVERVIEW_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN an error', () => {
    it('THEN the error placeholder renders', async () => {
      renderWithHeader({
        context: 'contract',
        data: undefined,
        phaseId: FINITE_PHASE.id,
        loading: false,
        hasError: true,
      })

      expect(await screen.findByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
      expect(getBreadcrumbLinks().map((link) => link.getAttribute('href'))).toEqual([
        CONTRACTS_ROUTE,
      ])
    })
  })
})
