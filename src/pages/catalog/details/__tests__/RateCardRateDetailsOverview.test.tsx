import { configure, render as rtlRender, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RateCardRateStatusEnum,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  buildRateCardForRateDetails,
  buildRateCardRate,
  buildRateProperties,
} from '../../__tests__/fixtures'
import RateCardRateDetailsOverview, {
  RATE_CARD_RATE_DETAILS_BILLING_INTERVAL_VALUE_KEY,
  RATE_CARD_RATE_DETAILS_OVERVIEW_EDIT_TEST_ID,
  RATE_CARD_RATE_DETAILS_OVERVIEW_NO_PRODUCT_CATEGORY_TEST_ID,
  RATE_CARD_RATE_DETAILS_OVERVIEW_STATUS_TEST_ID,
} from '../RateCardRateDetailsOverview'

configure({ testIdAttribute: 'data-test' })

const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/plans/useCustomPricingUnits', () => ({
  useCustomPricingUnits: () => ({
    hasAnyPricingUnitConfigured: true,
    pricingUnits: [{ id: 'pu-1', name: 'Tokens', code: 'tokens', shortName: 'tok' }],
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}|${Object.values(vars).join('|')}` : key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: 'Jan 24, 2026', time: '00:00' }),
  }),
}))

const renderOverview = ({
  rate = buildRateCardRate(),
  rateCard = buildRateCardForRateDetails(),
  onEdit,
}: {
  rate?: ReturnType<typeof buildRateCardRate>
  rateCard?: ReturnType<typeof buildRateCardForRateDetails>
  onEdit?: () => void
} = {}) =>
  rtlRender(
    <RateCardRateDetailsOverview rate={rate as never} rateCard={rateCard} onEdit={onEdit} />,
    {
      wrapper: ({ children }) => <AllTheProviders mocks={[]}>{children}</AllTheProviders>,
    },
  )

describe('RateCardRateDetailsOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('GIVEN a rate on an arrears card', () => {
    describe('WHEN the overview renders', () => {
      it('THEN shows the rate code', () => {
        renderOverview()

        expect(screen.getByText('rate_01_24_2026')).toBeInTheDocument()
      })

      it('THEN shows the effective date in the organization timezone', () => {
        renderOverview()

        expect(screen.getByText('Jan 24, 2026')).toBeInTheDocument()
      })

      it('THEN shows the status badge', () => {
        renderOverview()

        expect(
          screen.getByTestId(RATE_CARD_RATE_DETAILS_OVERVIEW_STATUS_TEST_ID),
        ).toBeInTheDocument()
      })

      it('THEN spells out the billing interval', () => {
        renderOverview({
          rate: buildRateCardRate({
            billingIntervalCount: 3,
            billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Week,
          }),
        })

        expect(
          screen.getByText(
            new RegExp(`^${RATE_CARD_RATE_DETAILS_BILLING_INTERVAL_VALUE_KEY}\\|3\\|`),
          ),
        ).toBeInTheDocument()
      })

      it('THEN links to the attached product, product category, product filter and rate card', () => {
        renderOverview({
          rateCard: buildRateCardForRateDetails({
            productFilter: { __typename: 'ProductFilter', id: 'pfilter-1', name: 'EU region' },
          }),
        })

        expect(screen.getByText('Platform').closest('a')).toHaveAttribute(
          'href',
          '/product-catalog/product-categories/pcategory-1/overview',
        )
        expect(screen.getByText('API calls').closest('a')).toHaveAttribute(
          'href',
          '/product-catalog/products/product-1/overview',
        )
        expect(screen.getByText('EU region').closest('a')).toHaveAttribute(
          'href',
          '/product-catalog/product-filters/pfilter-1/overview',
        )
        // The rate card crumb points at its rates tab, where this rate lives.
        expect(screen.getByText('Enterprise rate card').closest('a')).toHaveAttribute(
          'href',
          '/product-catalog/rate-cards/rc-1/rates',
        )
      })

      it('THEN falls back to a dash on the product filter and to a label on the category', () => {
        renderOverview({
          // A spending minimum, so the only dash left is the product filter row.
          rate: buildRateCardRate({ minAmountCents: '2500' }),
          rateCard: buildRateCardForRateDetails({
            product: {
              __typename: 'Product',
              id: 'product-1',
              name: 'API calls',
              productCategory: null,
            },
            productFilter: null,
          }),
        })

        expect(screen.getAllByText('-')).toHaveLength(1)
        expect(
          screen.getByTestId(RATE_CARD_RATE_DETAILS_OVERVIEW_NO_PRODUCT_CATEGORY_TEST_ID),
        ).toBeInTheDocument()
      })

      it('THEN shows the spending minimum', () => {
        renderOverview({ rate: buildRateCardRate({ minAmountCents: '2500' }) })

        expect(screen.getByText('$25.00')).toBeInTheDocument()
      })

      // A rate saved without a spending minimum stores 0, and "$0.00" reads as a configured
      // zero floor rather than "none set".
      it.each([
        ['zero', '0'],
        ['unset', null],
      ])('THEN renders no amount when the minimum is %s', (_, minAmountCents) => {
        renderOverview({ rate: buildRateCardRate({ minAmountCents }) })

        expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a rate on a pay-in-advance card', () => {
    describe('WHEN the overview renders', () => {
      it('THEN hides the spending minimum, which cannot exist there', () => {
        renderOverview({
          rate: buildRateCardRate({ minAmountCents: '2500' }),
          rateCard: buildRateCardForRateDetails({
            billingTiming: RateCardBillingTimingEnum.Advance,
          }),
        })

        expect(screen.queryByText('$25.00')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the pricing values of the rate', () => {
    describe('WHEN a standard rate renders', () => {
      it('THEN shows the amount table', () => {
        renderOverview()

        expect(screen.getByText('$10.00')).toBeInTheDocument()
      })
    })

    describe('WHEN a graduated rate renders', () => {
      it('THEN shows a row per tier with the infinity upper bound', () => {
        renderOverview({
          rate: buildRateCardRate({
            rateModel: RateCardRateModelEnum.Graduated,
            rateProperties: buildRateProperties({
              amount: null,
              graduatedRanges: [
                {
                  __typename: 'GraduatedRange',
                  fromValue: 0,
                  toValue: 10,
                  perUnitAmount: '5',
                  flatAmount: '1',
                },
                {
                  __typename: 'GraduatedRange',
                  fromValue: 11,
                  toValue: null,
                  perUnitAmount: '2',
                  flatAmount: '0',
                },
              ],
            }),
          }),
        })

        expect(screen.getByText('∞')).toBeInTheDocument()
        expect(screen.getByText('$5.00')).toBeInTheDocument()
        expect(screen.getByText('$2.00')).toBeInTheDocument()
      })
    })

    describe('WHEN the rate carries pricing group keys', () => {
      it('THEN shows a chip per key', () => {
        renderOverview({
          rate: buildRateCardRate({
            rateProperties: buildRateProperties({ pricingGroupKeys: ['region', 'tier'] }),
          }),
        })

        expect(screen.getByText('region')).toBeInTheDocument()
        expect(screen.getByText('tier')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the rate can be edited', () => {
    describe('WHEN the edit action is used', () => {
      it('THEN runs the provided edit callback', async () => {
        const onEdit = jest.fn()

        renderOverview({ onEdit })

        await userEvent.click(screen.getByTestId(RATE_CARD_RATE_DETAILS_OVERVIEW_EDIT_TEST_ID))

        expect(onEdit).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the rate cannot be edited', () => {
    describe('WHEN the overview renders', () => {
      it('THEN hides the edit action', () => {
        renderOverview()

        expect(
          screen.queryByTestId(RATE_CARD_RATE_DETAILS_OVERVIEW_EDIT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user lacks the update permission', () => {
    describe('WHEN the overview renders', () => {
      it('THEN hides the edit action even when an edit callback is provided', () => {
        mockHasPermissions.mockReturnValue(false)

        renderOverview({ onEdit: jest.fn() })

        expect(
          screen.queryByTestId(RATE_CARD_RATE_DETAILS_OVERVIEW_EDIT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a terminated rate', () => {
    describe('WHEN the overview renders', () => {
      it('THEN still shows its pricing, kept for history', () => {
        renderOverview({
          rate: buildRateCardRate({ status: RateCardRateStatusEnum.Terminated }),
        })

        expect(screen.getByText('$10.00')).toBeInTheDocument()
      })
    })
  })
})
