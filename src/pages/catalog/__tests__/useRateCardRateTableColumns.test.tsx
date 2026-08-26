import { renderHook, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableColumn } from '~/components/designSystem/Table/Table'
import {
  CurrencyEnum,
  RateCardRateForListFragment,
  RateCardRateModelEnum,
  RateCardRateStatusEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { buildRateCardRate, buildRateProperties } from './fixtures'

import {
  RATE_CARD_RATE_TABLE_STATUS_TEST_ID,
  useRateCardRateTableColumns,
} from '../useRateCardRateTableColumns'
import {
  FROM_TO_RATE_KEY as mockFromToRateKey,
  STANDARD_RATE_KEY as mockStandardRateKey,
  TIERED_RATE_KEY as mockTieredRateKey,
} from '../utils/formatActiveRate'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, variables?: Record<string, unknown>) => {
      const templates: Record<string, string> = {
        [mockStandardRateKey]: '{{amount}} per unit',
        [mockFromToRateKey]: 'From {{min}} to {{max}}',
        [mockTieredRateKey]: '{{label}} ({{count}} tiers)',
        // charge-model label keys (chargeModelLookupTranslation)
        text_65201b8216455901fe273dd6: 'Standard',
        text_65201b8216455901fe273e11: 'Graduated',
      }
      const template = templates[key]

      if (!template) return key

      return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(variables?.[name]))
    },
  }),
}))

jest.mock('~/hooks/plans/useCustomPricingUnits', () => ({
  useCustomPricingUnits: () => ({
    hasAnyPricingUnitConfigured: true,
    pricingUnits: [{ id: 'pu-1', name: 'Tokens', code: 'tokens', shortName: 'tok' }],
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: (date: string) => ({
      date: date.startsWith('2026-01-24') ? 'Jan 24, 2026' : 'Jan 20, 2026',
      time: '00:00',
    }),
  }),
}))

const renderColumns = (appliedPricingUnitCode: string | null = null) =>
  renderHook(() =>
    useRateCardRateTableColumns({ currency: CurrencyEnum.Usd, appliedPricingUnitCode }),
  ).result.current

const getColumnContent = (
  columns: Array<TableColumn<RateCardRateForListFragment>>,
  key: string,
): ((item: RateCardRateForListFragment) => ReactNode) => {
  const column = columns.find((candidate) => candidate.key === key)

  if (!column?.content) {
    throw new Error(`Column "${key}" or its content renderer was not found`)
  }

  return column.content
}

describe('useRateCardRateTableColumns', () => {
  describe('GIVEN the rates list', () => {
    describe('WHEN the hook runs', () => {
      it('THEN returns the status, effective date, code, price and creation date columns in order', () => {
        expect(renderColumns().map((column) => column.key)).toEqual([
          'status',
          'effectiveFrom',
          'code',
          'rateProperties.amount',
          'createdAt',
        ])
      })

      it('THEN right-aligns the price and creation date columns', () => {
        const columns = renderColumns()

        expect(columns.find((column) => column.key === 'rateProperties.amount')?.textAlign).toBe(
          'right',
        )
        expect(columns.find((column) => column.key === 'createdAt')?.textAlign).toBe('right')
      })
    })
  })

  describe('GIVEN a rate row', () => {
    // The badge copy comes from the Status component's own contextual-locale translations;
    // the status -> badge mapping itself is covered by statusRateCardRateMapping.test.ts.
    describe('WHEN the status column content renders', () => {
      it.each([
        RateCardRateStatusEnum.Pending,
        RateCardRateStatusEnum.Active,
        RateCardRateStatusEnum.Terminated,
      ])('THEN renders a badge for the %s status', (status) => {
        const columns = renderColumns()

        render(<>{getColumnContent(columns, 'status')(buildRateCardRate({ status }))}</>)

        expect(screen.getByTestId(RATE_CARD_RATE_TABLE_STATUS_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the effective date column content renders', () => {
      it('THEN shows the organization-timezone formatted date', () => {
        const columns = renderColumns()

        render(<>{getColumnContent(columns, 'effectiveFrom')(buildRateCardRate())}</>)

        expect(screen.getByText('Jan 24, 2026')).toBeInTheDocument()
      })
    })

    describe('WHEN the code column content renders', () => {
      it('THEN shows the rate code', () => {
        const columns = renderColumns()

        render(<>{getColumnContent(columns, 'code')(buildRateCardRate())}</>)

        expect(screen.getByText('rate_01_24_2026')).toBeInTheDocument()
      })
    })

    describe('WHEN the price column content renders', () => {
      it('THEN shows the standard amount and the model label', () => {
        const columns = renderColumns()

        render(<>{getColumnContent(columns, 'rateProperties.amount')(buildRateCardRate())}</>)

        expect(screen.getByText('$10.00 per unit')).toBeInTheDocument()
        expect(screen.getByText('Standard')).toBeInTheDocument()
      })

      it('THEN shows the tier range and the tier count for a graduated rate', () => {
        const columns = renderColumns()

        render(
          <>
            {getColumnContent(
              columns,
              'rateProperties.amount',
            )(
              buildRateCardRate({
                rateModel: RateCardRateModelEnum.Graduated,
                rateProperties: buildRateProperties({
                  amount: null,
                  graduatedRanges: [
                    {
                      __typename: 'GraduatedRange',
                      fromValue: 0,
                      toValue: 10,
                      perUnitAmount: '10',
                      flatAmount: '0',
                    },
                    {
                      __typename: 'GraduatedRange',
                      fromValue: 11,
                      toValue: null,
                      perUnitAmount: '100',
                      flatAmount: '0',
                    },
                  ],
                }),
              }),
            )}
          </>,
        )

        expect(screen.getByText('From $10.00 to $100.00')).toBeInTheDocument()
        expect(screen.getByText('Graduated (2 tiers)')).toBeInTheDocument()
      })

      it('THEN labels the price with the pricing unit short name, not its code', () => {
        const columns = renderColumns('tokens')

        render(<>{getColumnContent(columns, 'rateProperties.amount')(buildRateCardRate())}</>)

        expect(screen.getByText(/tok/)).toBeInTheDocument()
        expect(screen.queryByText(/tokens/)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the creation date column content renders', () => {
      it('THEN shows the organization-timezone formatted date', () => {
        const columns = renderColumns()

        render(<>{getColumnContent(columns, 'createdAt')(buildRateCardRate())}</>)

        expect(screen.getByText('Jan 20, 2026')).toBeInTheDocument()
      })
    })
  })
})
