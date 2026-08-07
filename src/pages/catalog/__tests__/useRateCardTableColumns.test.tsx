import { renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableColumn } from '~/components/designSystem/Table/Table'
import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardForListFragment,
  RateCardRateModelEnum,
  RateCardRegroupPaidFeesEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { useRateCardTableColumns } from '../useRateCardTableColumns'
import {
  STANDARD_RATE_KEY as mockStandardRateKey,
  NO_ACTIVE_RATE_KEY,
} from '../utils/formatActiveRate'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, variables?: Record<string, unknown>) => {
      const templates: Record<string, string> = {
        [mockStandardRateKey]: '{{amount}} per unit',
      }
      const template = templates[key]

      if (!template) return key

      return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(variables?.[name]))
    },
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: 'Jan 20, 2024', time: '00:00' }),
  }),
}))

const buildRateCard = (
  overrides: Partial<RateCardForListFragment> = {},
): RateCardForListFragment => ({
  __typename: 'RateCard',
  id: 'rate-card-1',
  name: 'Enterprise plan',
  code: 'enterprise_plan',
  createdAt: '2024-01-20T00:00:00Z',
  ratesCount: 3,
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: null,
  description: null,
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
    productType: ProductTypeEnum.Fixed,
    billableMetric: null,
  },
  productFilter: null,
  activeRate: null,
  ...overrides,
})

const renderColumns = (withAttachedTo: boolean) =>
  renderHook(() => useRateCardTableColumns({ withAttachedTo })).result.current

const getColumnContent = (
  columns: Array<TableColumn<RateCardForListFragment> | null>,
  key: string,
): ((item: RateCardForListFragment) => ReactNode) => {
  const column = columns.find(
    (candidate): candidate is TableColumn<RateCardForListFragment> => candidate?.key === key,
  )

  if (!column?.content) {
    throw new Error(`Column "${key}" or its content renderer was not found`)
  }

  return column.content
}

describe('useRateCardTableColumns', () => {
  describe('GIVEN the attached-to column is requested', () => {
    describe('WHEN the hook runs', () => {
      it('THEN returns the name, attached-to, active rate, rates count and created columns', () => {
        const columns = renderColumns(true)

        expect(columns.filter(Boolean).map((column) => column?.key)).toEqual([
          'name',
          'productFilter.name',
          'activeRate',
          'ratesCount',
          'createdAt',
        ])
      })
    })
  })

  describe('GIVEN the attached-to column is not requested', () => {
    describe('WHEN the hook runs', () => {
      it('THEN drops the attached-to column', () => {
        const columns = renderColumns(false)

        expect(columns.filter(Boolean).map((column) => column?.key)).toEqual([
          'name',
          'activeRate',
          'ratesCount',
          'createdAt',
        ])
      })
    })
  })

  describe('GIVEN a rate card row', () => {
    describe('WHEN the name column content renders', () => {
      it('THEN shows the name and the code', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'name')(buildRateCard())}</>)

        expect(screen.getByText('Enterprise plan')).toBeInTheDocument()
        expect(screen.getByText('enterprise_plan')).toBeInTheDocument()
      })
    })

    describe('WHEN the attached-to column content renders', () => {
      it('THEN prefers the attached product item filter name and links to its details', () => {
        const columns = renderColumns(true)

        render(
          <>
            {getColumnContent(
              columns,
              'productFilter.name',
            )(
              buildRateCard({
                productFilter: {
                  __typename: 'ProductFilter',
                  id: 'pfilter-1',
                  name: 'Premium seats',
                  code: 'premium_seats',
                },
              }),
            )}
          </>,
        )

        const link = screen.getByText('Premium seats').closest('a')

        expect(link).toHaveAttribute('href', '/product-catalog/product-filters/pfilter-1/overview')
      })

      it('THEN falls back to the attached product item name and links to its details', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'productFilter.name')(buildRateCard())}</>)

        const link = screen.getByText('Seats').closest('a')

        expect(link).toHaveAttribute('href', '/product-catalog/products/pitem-1/overview')
      })
    })

    describe('WHEN the active rate column content renders', () => {
      it('THEN shows the "no active rate" label when there is none', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'activeRate')(buildRateCard())}</>)

        expect(screen.getByText(NO_ACTIVE_RATE_KEY)).toBeInTheDocument()
      })

      it('THEN shows the formatted amount for a standard active rate', () => {
        const columns = renderColumns(true)

        render(
          <>
            {getColumnContent(
              columns,
              'activeRate',
            )(
              buildRateCard({
                activeRate: {
                  __typename: 'RateCardRate',
                  id: 'rate-1',
                  rateModel: RateCardRateModelEnum.Standard,
                  rateProperties: { amount: '10' },
                  minAmountCents: '0',
                },
              }),
            )}
          </>,
        )

        expect(screen.getByText('$10.00 per unit')).toBeInTheDocument()
      })
    })

    describe('WHEN the rates count column content renders', () => {
      it('THEN shows the rates count', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'ratesCount')(buildRateCard({ ratesCount: 5 }))}</>)

        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })

    describe('WHEN the created column content renders', () => {
      it('THEN shows the organization-timezone formatted date', () => {
        const columns = renderColumns(true)

        render(<>{getColumnContent(columns, 'createdAt')(buildRateCard())}</>)

        expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument()
      })
    })
  })
})
