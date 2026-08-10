import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CurrencyEnum,
  GetRateCardForDetailsOverviewDocument,
  RateCardBillingTimingEnum,
  RateCardForDetailsOverviewFragment,
  RateCardRegroupPaidFeesEnum,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import RateCardDetailsOverview, {
  RATE_CARD_DETAILS_OVERVIEW_EDIT_TEST_ID,
} from '../RateCardDetailsOverview'

const mockOpenEditRateCardDrawer = jest.fn()
const mockHasPermissions = jest.fn()
let mockPricingUnits: Array<{ id: string; name: string; code: string; shortName?: string }> = []

jest.mock('~/pages/catalog/drawers/rateCard/useRateCardDrawer', () => ({
  useRateCardDrawer: () => ({ openDrawer: mockOpenEditRateCardDrawer }),
}))

jest.mock('~/hooks/plans/useCustomPricingUnits', () => ({
  useCustomPricingUnits: () => ({
    pricingUnits: mockPricingUnits,
    hasAnyPricingUnitConfigured: mockPricingUnits.length > 0,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const attachedRateCard: RateCardForDetailsOverviewFragment = {
  __typename: 'RateCard',
  id: 'rc-1',
  name: 'Standard rate card',
  code: 'standard_rate_card',
  description: 'The standard rate card',
  currency: 'USD',
  appliedPricingUnitCode: null,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  displayOnInvoice: true,
  regroupPaidFees: RateCardRegroupPaidFeesEnum.None,
  proration: false,
  walletTargetable: false,
  attachedToPlanOrSubscription: false,
  attachedToSubscriptions: false,
  product: {
    __typename: 'Product',
    id: 'pitem-1',
    name: 'Seats',
    code: 'seats',
    productType: 'usage',
    billableMetric: {
      __typename: 'BillableMetric',
      id: 'bm-1',
      name: 'Seats used',
      code: 'seats_used',
      aggregationType: 'count_agg',
      recurring: false,
    },
  },
  productFilter: {
    __typename: 'ProductFilter',
    id: 'filter-1',
    name: 'EU pro filter',
    code: 'eu_pro_filter',
  },
} as RateCardForDetailsOverviewFragment

const noFilterRateCard: RateCardForDetailsOverviewFragment = {
  ...attachedRateCard,
  productFilter: null,
}

const pricingUnitRateCard: RateCardForDetailsOverviewFragment = {
  ...attachedRateCard,
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: 'credit',
}

const buildMock = (rateCard: RateCardForDetailsOverviewFragment): TestMocksType => [
  {
    request: {
      query: GetRateCardForDetailsOverviewDocument,
      variables: { id: 'rc-1' },
    },
    result: { data: { rateCard } },
  },
]

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderOverview = (rateCard: RateCardForDetailsOverviewFragment = attachedRateCard) =>
  rtlRender(<RateCardDetailsOverview rateCardId="rc-1" />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={buildMock(rateCard)}>
        {children}
      </AllTheProviders>
    ),
  })

describe('RateCardDetailsOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockPricingUnits = []
  })

  describe('GIVEN the overview is loading', () => {
    describe('WHEN the query has not resolved yet', () => {
      it('THEN displays the skeleton', () => {
        const { container } = renderOverview()

        expect(screen.queryByText('Standard rate card')).not.toBeInTheDocument()
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a rate card attached to a product item and a product item filter', () => {
    describe('WHEN the overview loads', () => {
      it('THEN displays the name, code and description', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('Standard rate card')).toBeInTheDocument()
        expect(screen.getByText('standard_rate_card')).toBeInTheDocument()
        expect(screen.getByText('The standard rate card')).toBeInTheDocument()
      })

      it('THEN links to the attached product item', async () => {
        await act(() => renderOverview())

        expect(await screen.findByRole('link', { name: 'Seats' })).toBeInTheDocument()
      })

      it('THEN links to the attached product item filter', async () => {
        await act(() => renderOverview())

        expect(await screen.findByRole('link', { name: 'EU pro filter' })).toBeInTheDocument()
      })

      it('THEN displays the currency when no pricing unit is applied', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('USD')).toBeInTheDocument()
      })

      it('THEN displays the billing timing as a human label', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('text_646e2d0cc536351b62ba6f8c')).toBeInTheDocument()
      })

      it('THEN displays the invoicing strategy as a human label', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('text_66968fba80f8f89a8aefdebf')).toBeInTheDocument()
      })

      it('THEN displays prorate amount and supports target wallet as No', async () => {
        await act(() => renderOverview())

        await screen.findByText('Standard rate card')
        expect(screen.getAllByText('text_176416000997957yqelmt2m2')).toHaveLength(2)
      })
    })
  })

  describe('GIVEN a rate card with no attached product item filter', () => {
    describe('WHEN the overview loads', () => {
      it('THEN shows a dash instead of a link', async () => {
        await act(() => renderOverview(noFilterRateCard))

        expect(await screen.findByText('Standard rate card')).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'EU pro filter' })).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a rate card priced in a custom pricing unit', () => {
    describe('WHEN the pricing unit is known', () => {
      it('THEN displays the pricing unit name instead of the currency', async () => {
        mockPricingUnits = [{ id: 'pu-1', name: 'Credits', code: 'credit' }]

        await act(() => renderOverview(pricingUnitRateCard))

        expect(await screen.findByText('Credits')).toBeInTheDocument()
        expect(screen.queryByText('USD')).not.toBeInTheDocument()
      })
    })

    describe('WHEN the pricing unit is not resolvable', () => {
      it('THEN falls back to displaying the pricing unit code', async () => {
        mockPricingUnits = []

        await act(() => renderOverview(pricingUnitRateCard))

        expect(await screen.findByText('credit')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the rateCardsUpdate permission', () => {
    describe('WHEN the edit button is clicked', () => {
      it('THEN opens the drawer with the loaded rate card', async () => {
        await act(() => renderOverview())

        await userEvent.click(await screen.findByTestId(RATE_CARD_DETAILS_OVERVIEW_EDIT_TEST_ID))

        expect(mockOpenEditRateCardDrawer).toHaveBeenCalledWith(
          expect.objectContaining({
            rateCard: expect.objectContaining({ id: 'rc-1', code: 'standard_rate_card' }),
          }),
        )
      })
    })
  })

  describe('GIVEN no rateCardsUpdate permission', () => {
    describe('WHEN the overview loads', () => {
      it('THEN hides the edit button', async () => {
        mockHasPermissions.mockReturnValue(false)

        await act(() => renderOverview())

        await waitFor(() => {
          expect(screen.getByText('Standard rate card')).toBeInTheDocument()
        })
        expect(
          screen.queryByTestId(RATE_CARD_DETAILS_OVERVIEW_EDIT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
