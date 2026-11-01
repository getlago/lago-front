import NiceModal from '@ebay/nice-modal-react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_NAME,
} from '~/components/dialogs/const'
import {
  CurrencyEnum,
  DestroyPlanAppliedRateCardDocument,
  GetPlanAppliedRateCardsForRateCardsSectionDocument,
} from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn, TestMocksType } from '~/test-utils'

import {
  CATALOG_PLAN_ADD_RATE_CARD_TEST_ID,
  CatalogPlanRateCardsSection,
} from '../CatalogPlanRateCardsSection'

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

const mockHasPermissions = jest.fn().mockReturnValue(true)
const mockOpenAppliedRateCardDrawer = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/components/appliedRateCards/drawers/appliedRateCard/useAppliedRateCardDrawer', () => ({
  useAppliedRateCardDrawer: () => ({ openDrawer: mockOpenAppliedRateCardDrawer }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const rowFixture = {
  id: 'applied-1',
  ratePhasesCount: 2,
  product: {
    id: 'product-1',
    name: 'Product One',
    invoiceDisplayName: null,
    productCategory: null,
    __typename: 'Product',
  },
  rateCard: {
    id: 'rc-1',
    name: 'Enterprise',
    code: 'enterprise',
    productFilter: null,
    __typename: 'RateCard',
  },
  __typename: 'PlanAppliedRateCard',
}

const buildListMock = (collection: (typeof rowFixture)[]): TestMocksType[number] => ({
  request: {
    query: GetPlanAppliedRateCardsForRateCardsSectionDocument,
    variables: { planId: 'plan-1', page: 1, limit: 20 },
  },
  result: {
    data: {
      planAppliedRateCards: {
        __typename: 'PlanAppliedRateCardCollection',
        collection,
        metadata: {
          __typename: 'CollectionMetadata',
          currentPage: 1,
          totalPages: 1,
          totalCount: collection.length,
        },
      },
    },
  },
})

const buildDestroyMutationMock = (): TestMocksType[number] => ({
  request: {
    query: DestroyPlanAppliedRateCardDocument,
    variables: { input: { id: 'applied-1' } },
  },
  result: {
    data: { destroyPlanAppliedRateCard: { id: 'applied-1', __typename: 'PlanAppliedRateCard' } },
  },
})

const renderSection = (mocks: TestMocksType, { isLocked = false } = {}) =>
  render(
    <AllTheProviders forceTypenames mocks={mocks}>
      <NiceModal.Provider>
        <CatalogPlanRateCardsSection
          catalogPlanId="plan-1"
          currency={CurrencyEnum.Usd}
          isLocked={isLocked}
        />
      </NiceModal.Provider>
    </AllTheProviders>,
  )

describe('CatalogPlanRateCardsSection', () => {
  beforeEach(() => {
    testMockNavigateFn.mockClear()
    mockHasPermissions.mockReturnValue(true)
  })

  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('queries planAppliedRateCards for the given catalogPlanId and renders the row', async () => {
    renderSection([buildListMock([rowFixture])])

    await waitFor(() => expect(screen.getByText('Product One')).toBeInTheDocument())
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('resets to page 1 before the debounced search fires', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })

    renderSection([buildListMock([rowFixture])])
    await waitFor(() => expect(screen.getByText('Product One')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText('text_17849293094725tv045xhkxf'), 'a')

    expect(testMockNavigateFn).toHaveBeenCalledWith({ search: '' }, { replace: true })
  })

  it('requests hasRateOverrides when the Has rate overrides filter is applied through the URL', async () => {
    const mocks = [
      {
        request: {
          query: GetPlanAppliedRateCardsForRateCardsSectionDocument,
          variables: { planId: 'plan-1', page: 1, limit: 20, hasRateOverrides: true },
        },
        result: {
          data: {
            planAppliedRateCards: {
              __typename: 'PlanAppliedRateCardCollection',
              collection: [rowFixture],
              metadata: {
                __typename: 'CollectionMetadata',
                currentPage: 1,
                totalPages: 1,
                totalCount: 1,
              },
            },
          },
        },
      },
    ]

    window.history.pushState({}, '', '/?arc_appliedRateCardHasOverrides=true')

    renderSection(mocks)

    await waitFor(() => expect(screen.getByText('Product One')).toBeInTheDocument())
  })

  it('shows the empty state when there are no applied rate cards', async () => {
    renderSection([buildListMock([])])

    await waitFor(() =>
      expect(screen.getByText('text_1789030049529u2gzzho6x8x')).toBeInTheDocument(),
    )
    expect(screen.getByText('text_17891323549937b5qwry7pn1')).toBeInTheDocument()
  })

  it('removes a row through the mutation then refetches the list', async () => {
    const user = userEvent.setup()

    renderSection([buildListMock([rowFixture]), buildDestroyMutationMock(), buildListMock([])])

    await waitFor(() => expect(screen.getByText('Product One')).toBeInTheDocument())

    await user.click(screen.getByTestId('open-action-button'))
    await user.click(screen.getByText('text_1790284386156k2d8mjjy98f'))
    await user.click(await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))

    await waitFor(() => expect(screen.queryByText('Product One')).not.toBeInTheDocument())
  })

  it('hides the remove action when the user lacks plansUpdate permission', async () => {
    mockHasPermissions.mockReturnValue(false)
    const user = userEvent.setup()

    renderSection([buildListMock([rowFixture])])
    await waitFor(() => expect(screen.getByText('Product One')).toBeInTheDocument())

    await user.click(screen.getByTestId('open-action-button'))

    expect(screen.queryByText('text_1790284386156k2d8mjjy98f')).not.toBeInTheDocument()
  })
  it('disables the remove action when the plan is attached to contracts', async () => {
    const user = userEvent.setup()

    renderSection([buildListMock([rowFixture])], { isLocked: true })
    await waitFor(() => expect(screen.getByText('Product One')).toBeInTheDocument())

    await user.click(screen.getByTestId('open-action-button'))

    expect(screen.getByText('text_1790284386156k2d8mjjy98f').closest('button')).toBeDisabled()
  })

  it('GIVEN the Add rate card button is clicked THEN openDrawer is called with { context: "plan", planId, currency }', async () => {
    const user = userEvent.setup()

    renderSection([buildListMock([])])
    await waitFor(() =>
      expect(screen.getByTestId(CATALOG_PLAN_ADD_RATE_CARD_TEST_ID)).toBeInTheDocument(),
    )

    await user.click(screen.getByTestId(CATALOG_PLAN_ADD_RATE_CARD_TEST_ID))

    expect(mockOpenAppliedRateCardDrawer).toHaveBeenCalledWith({
      context: 'plan',
      planId: 'plan-1',
      currency: CurrencyEnum.Usd,
    })
  })

  it('GIVEN the plan is attached to contracts THEN the Add rate card button is disabled', async () => {
    renderSection([buildListMock([])], { isLocked: true })

    await waitFor(() =>
      expect(screen.getByTestId(CATALOG_PLAN_ADD_RATE_CARD_TEST_ID)).toBeDisabled(),
    )
  })

  it('GIVEN the user lacks plansUpdate THEN the Add rate card action is hidden', async () => {
    mockHasPermissions.mockReturnValue(false)

    renderSection([buildListMock([])])

    expect(mockHasPermissions).toHaveBeenCalledWith([
      'plansUpdate',
      'productsView',
      'rateCardsView',
    ])
    expect(screen.queryByTestId(CATALOG_PLAN_ADD_RATE_CARD_TEST_ID)).not.toBeInTheDocument()
  })

  it.each(['productsView', 'rateCardsView'])(
    'GIVEN the user lacks %s THEN the Add rate card action is hidden',
    async (missingPermission) => {
      mockHasPermissions.mockImplementation(
        (permissions: string[]) => !permissions.includes(missingPermission),
      )

      renderSection([buildListMock([])])

      expect(screen.queryByTestId(CATALOG_PLAN_ADD_RATE_CARD_TEST_ID)).not.toBeInTheDocument()
    },
  )
})
