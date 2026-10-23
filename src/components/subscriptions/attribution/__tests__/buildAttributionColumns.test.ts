import { ALL_FILTER_VALUES } from '~/core/constants/form'
import {
  AttributedUsageBasisEnum,
  AttributionChargeUsageFragment,
  ChargeModelEnum,
} from '~/generated/graphql'

import {
  buildAttributionColumns,
  COLLAPSED_FILTER_COLUMNS,
  getAttributionCellUsage,
  getAttributionChargeLabel,
  getAttributionDisplayedValue,
  getAttributionTotalUsage,
  isAttributionAmountAvailable,
} from '../buildAttributionColumns'

type AttributionCharge = AttributionChargeUsageFragment['charge']

const createCharge = (overrides: Partial<AttributionCharge> = {}): AttributionCharge => ({
  id: 'charge-tokens',
  code: 'tokens',
  invoiceDisplayName: null,
  chargeModel: ChargeModelEnum.Standard,
  billableMetric: { id: 'bm-tokens', name: 'Tokens' },
  filters: [],
  ...overrides,
})

const createChargeUsage = ({
  charge = createCharge(),
  chargeFilter = null,
  units = 0,
  amountCents = null,
}: Partial<AttributionChargeUsageFragment> = {}): AttributionChargeUsageFragment => ({
  charge,
  chargeFilter,
  units,
  amountCents,
})

const createFilter = (
  id: string,
  model: string,
  invoiceDisplayName: string | null = null,
): NonNullable<AttributionChargeUsageFragment['chargeFilter']> => ({
  id,
  invoiceDisplayName,
  values: { model: [model] },
})

const splitCharge = createCharge({
  filters: [{ id: 'filter-opus' }, { id: 'filter-sonnet' }],
})

const buildSplitChargesUsage = (models: string[]): AttributionChargeUsageFragment[] => [
  ...models.map((model) =>
    createChargeUsage({
      charge: splitCharge,
      chargeFilter: createFilter(`filter-${model}`, model),
    }),
  ),
  createChargeUsage({ charge: splitCharge, chargeFilter: null }),
]

describe('buildAttributionColumns', () => {
  describe('GIVEN no charge is selected', () => {
    describe('WHEN the columns are built', () => {
      it('THEN should return no charge column so only the total is displayed', () => {
        const result = buildAttributionColumns({
          chargesUsage: [
            createChargeUsage(),
            createChargeUsage({ charge: createCharge({ id: 'other' }) }),
          ],
          selectedChargeId: null,
          isExpanded: false,
        })

        expect(result).toEqual({ columns: [], hiddenColumnsCount: 0 })
      })
    })
  })

  describe('GIVEN one split charge is selected', () => {
    describe('WHEN it has up to the collapsed number of filters', () => {
      it('THEN should list the filters in response order with the default column last', () => {
        const result = buildAttributionColumns({
          chargesUsage: buildSplitChargesUsage(['opus', 'sonnet', 'haiku']),
          selectedChargeId: splitCharge.id,
          isExpanded: false,
        })

        expect(result.columns.map((column) => column.label)).toEqual([
          'opus',
          'sonnet',
          'haiku',
          null,
        ])
        expect(result.columns.at(-1)?.chargeFilterId).toBeNull()
        expect(result.hiddenColumnsCount).toBe(0)
      })
    })

    describe('WHEN it has more filters than the collapsed limit and is collapsed', () => {
      it('THEN should show the first filters plus the default and count the hidden ones', () => {
        const models = ['opus', 'sonnet', 'haiku', 'gpt', 'gemini']
        const result = buildAttributionColumns({
          chargesUsage: buildSplitChargesUsage(models),
          selectedChargeId: splitCharge.id,
          isExpanded: false,
        })

        expect(result.columns.map((column) => column.chargeFilterId)).toEqual([
          'filter-opus',
          'filter-sonnet',
          'filter-haiku',
          null,
        ])
        expect(result.hiddenColumnsCount).toBe(models.length - COLLAPSED_FILTER_COLUMNS)
      })
    })

    describe('WHEN it has more filters than the collapsed limit and is expanded', () => {
      it('THEN should show every filter column and the default', () => {
        const result = buildAttributionColumns({
          chargesUsage: buildSplitChargesUsage(['opus', 'sonnet', 'haiku', 'gpt', 'gemini']),
          selectedChargeId: splitCharge.id,
          isExpanded: true,
        })

        expect(result.columns).toHaveLength(6)
        expect(result.hiddenColumnsCount).toBe(0)
      })
    })

    describe('WHEN the response also holds usage of another charge', () => {
      it('THEN should only build columns for the selected charge', () => {
        const result = buildAttributionColumns({
          chargesUsage: [
            ...buildSplitChargesUsage(['opus']),
            createChargeUsage({ charge: createCharge({ id: 'other' }) }),
          ],
          selectedChargeId: splitCharge.id,
          isExpanded: false,
        })

        expect(result.columns.every((column) => column.chargeId === splitCharge.id)).toBe(true)
      })
    })

    describe('WHEN a filter has an invoice display name', () => {
      it('THEN should use it as the column label', () => {
        const result = buildAttributionColumns({
          chargesUsage: [
            createChargeUsage({
              charge: splitCharge,
              chargeFilter: createFilter('filter-opus', 'opus', 'Claude Opus'),
            }),
          ],
          selectedChargeId: splitCharge.id,
          isExpanded: false,
        })

        expect(result.columns[0].label).toBe('Claude Opus')
      })
    })

    describe('WHEN a filter matches all the values of its key', () => {
      it('THEN should label the column with the key instead of the internal value', () => {
        const result = buildAttributionColumns({
          chargesUsage: [
            createChargeUsage({
              charge: splitCharge,
              chargeFilter: {
                id: 'filter-all-models',
                invoiceDisplayName: null,
                values: { model: [ALL_FILTER_VALUES] },
              },
            }),
          ],
          selectedChargeId: splitCharge.id,
          isExpanded: false,
        })

        expect(result.columns[0].label).toBe('model')
      })
    })
  })
})

describe('getAttributionCellUsage', () => {
  const chargesUsage = [
    createChargeUsage({
      charge: splitCharge,
      chargeFilter: createFilter('filter-opus', 'opus'),
      units: 12,
      amountCents: '300',
    }),
    createChargeUsage({ charge: splitCharge, chargeFilter: null, units: 4 }),
  ]

  describe('GIVEN a filter column', () => {
    it('THEN should return the usage matching the charge and the filter', () => {
      expect(
        getAttributionCellUsage(chargesUsage, {
          key: 'opus',
          chargeId: splitCharge.id,
          chargeFilterId: 'filter-opus',
          label: 'opus',
        }),
      ).toEqual({ units: 12, amountCents: '300' })
    })
  })

  describe('GIVEN the default column', () => {
    it('THEN should return the usage without a charge filter', () => {
      expect(
        getAttributionCellUsage(chargesUsage, {
          key: 'default',
          chargeId: splitCharge.id,
          chargeFilterId: null,
          label: null,
        }),
      ).toEqual({ units: 4, amountCents: null })
    })
  })

  describe('GIVEN a column with no matching usage', () => {
    it('THEN should return null', () => {
      expect(
        getAttributionCellUsage(chargesUsage, {
          key: 'missing',
          chargeId: 'unknown',
          chargeFilterId: null,
          label: null,
        }),
      ).toBeNull()
    })
  })
})

describe('getAttributionTotalUsage', () => {
  describe('GIVEN several charge usages', () => {
    it('THEN should sum the units and keep the aggregate amount', () => {
      expect(
        getAttributionTotalUsage({
          chargesUsage: [createChargeUsage({ units: 2 }), createChargeUsage({ units: 3.5 })],
          amountCents: '1200',
        }),
      ).toEqual({ units: 5.5, amountCents: '1200' })
    })
  })

  describe('GIVEN no aggregate amount', () => {
    it('THEN should return a null amount', () => {
      expect(getAttributionTotalUsage({ chargesUsage: [] })).toEqual({
        units: 0,
        amountCents: null,
      })
    })
  })
})

describe('getAttributionDisplayedValue', () => {
  it.each([
    ['units basis', AttributedUsageBasisEnum.Units, { units: 7, amountCents: '900' }, 7],
    ['amount basis', AttributedUsageBasisEnum.Amount, { units: 7, amountCents: '900' }, 900],
    ['zero units', AttributedUsageBasisEnum.Units, { units: 0, amountCents: null }, null],
    ['missing amount', AttributedUsageBasisEnum.Amount, { units: 7, amountCents: null }, null],
    ['zero amount', AttributedUsageBasisEnum.Amount, { units: 7, amountCents: '0' }, null],
    ['no usage', AttributedUsageBasisEnum.Units, null, null],
  ])('THEN should return the right value for %s', (_, basis, usage, expected) => {
    expect(getAttributionDisplayedValue({ basis, usage })).toBe(expected)
  })
})

describe('getAttributionChargeLabel', () => {
  it.each([
    ['the invoice display name when set', 'AI tokens', 'AI tokens'],
    ['the billable metric name otherwise', null, 'Tokens'],
  ])('THEN should return %s', (_, invoiceDisplayName, expected) => {
    expect(getAttributionChargeLabel(createCharge({ invoiceDisplayName }))).toBe(expected)
  })
})

describe('isAttributionAmountAvailable', () => {
  describe('GIVEN at least one standard charge', () => {
    it('THEN should allow the amount basis', () => {
      expect(
        isAttributionAmountAvailable([
          createCharge({ chargeModel: ChargeModelEnum.Graduated }),
          createCharge({ chargeModel: ChargeModelEnum.Standard }),
        ]),
      ).toBe(true)
    })
  })

  describe('GIVEN only non-standard charges', () => {
    it('THEN should not allow the amount basis', () => {
      expect(
        isAttributionAmountAvailable([createCharge({ chargeModel: ChargeModelEnum.Package })]),
      ).toBe(false)
    })
  })

  describe('GIVEN no charge', () => {
    it('THEN should not allow the amount basis', () => {
      expect(isAttributionAmountAvailable([])).toBe(false)
    })
  })
})
