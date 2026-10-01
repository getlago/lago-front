import { screen, within } from '@testing-library/react'

import {
  CurrencyEnum,
  PropertiesForRateCardRateFragment,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  buildGraduatedPercentageRanges,
  buildGraduatedRanges,
  buildRateProperties,
  buildVolumeRanges,
} from '../../__tests__/fixtures'
import { RateDetailsWrapperSwitch } from '../RateDetailsWrapperSwitch'
import {
  RATE_TIER_FIRST_LABEL_KEY,
  RATE_TIER_NEXT_LABEL_KEY,
  RATE_TIER_TOTAL_UNITS_LABEL_KEY,
  RATE_TIER_UP_TO_KEY,
} from '../tiers/rateTiers'

const mockJsonEditorTestId = 'json-editor'
const mockDynamicChargeTestId = 'dynamic-charge'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/components/form', () => ({
  JsonEditor: ({ value }: { value?: unknown }) => (
    <div data-test={mockJsonEditorTestId}>{JSON.stringify(value)}</div>
  ),
}))

jest.mock('~/components/plans/DynamicCharge', () => ({
  DynamicCharge: () => <div data-test={mockDynamicChargeTestId} />,
}))

const renderSwitch = (
  rateModel: RateCardRateModelEnum,
  rateProperties: PropertiesForRateCardRateFragment,
  pricingUnitShortName?: string,
): void => {
  render(
    <RateDetailsWrapperSwitch
      rateModel={rateModel}
      rateProperties={rateProperties}
      currency={CurrencyEnum.Usd}
      pricingUnitShortName={pricingUnitShortName}
    />,
  )
}

const getHeaderTexts = (): string[] =>
  screen.getAllByRole('columnheader').map((header) => header.textContent ?? '')

const getBodyRowTexts = (): string[][] =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent ?? ''),
    )

describe('RateDetailsWrapperSwitch', () => {
  describe('GIVEN a graduated rate', () => {
    describe('WHEN it renders', () => {
      it('THEN shows one up-to row per tier with an open last tier', () => {
        renderSwitch(
          RateCardRateModelEnum.Graduated,
          buildRateProperties({ amount: null, graduatedRanges: buildGraduatedRanges() }),
        )

        expect(getHeaderTexts()).toEqual([
          '',
          RATE_TIER_UP_TO_KEY,
          'text_62793bbb599f1c01522e91b6',
          'text_62793bbb599f1c01522e91bc',
        ])
        expect(getBodyRowTexts()).toEqual([
          [RATE_TIER_FIRST_LABEL_KEY, '10', '$5.00', '$1.00'],
          [RATE_TIER_NEXT_LABEL_KEY, '∞', '$2.00', '$0.00'],
        ])
      })
    })

    describe('WHEN the card prices in a custom pricing unit', () => {
      it('THEN shows the amounts in the unit short name', () => {
        renderSwitch(
          RateCardRateModelEnum.Graduated,
          buildRateProperties({ amount: null, graduatedRanges: buildGraduatedRanges() }),
          'tok',
        )

        expect(getBodyRowTexts()[0]).toEqual([
          RATE_TIER_FIRST_LABEL_KEY,
          '10',
          '5.00 tok',
          '1.00 tok',
        ])
      })
    })
  })

  describe('GIVEN a volume rate', () => {
    describe('WHEN it renders', () => {
      it('THEN labels every tier with total units', () => {
        renderSwitch(
          RateCardRateModelEnum.Volume,
          buildRateProperties({ amount: null, volumeRanges: buildVolumeRanges() }),
        )

        expect(getBodyRowTexts()).toEqual([
          [RATE_TIER_TOTAL_UNITS_LABEL_KEY, '100', '$1.00', '$0.00'],
          [RATE_TIER_TOTAL_UNITS_LABEL_KEY, '∞', '$0.50', '$2.00'],
        ])
      })
    })
  })

  describe('GIVEN a graduated percentage rate', () => {
    describe('WHEN it renders', () => {
      it('THEN shows the rate column in percent', () => {
        renderSwitch(
          RateCardRateModelEnum.GraduatedPercentage,
          buildRateProperties({
            amount: null,
            graduatedPercentageRanges: buildGraduatedPercentageRanges(),
          }),
        )

        expect(getHeaderTexts()).toEqual([
          '',
          RATE_TIER_UP_TO_KEY,
          'text_64de472463e2da6b31737de0',
          'text_62793bbb599f1c01522e91bc',
        ])
        expect(getBodyRowTexts()).toEqual([
          [RATE_TIER_FIRST_LABEL_KEY, '10000', '0.10%', '$1.00'],
          [RATE_TIER_NEXT_LABEL_KEY, '∞', '0.05%', '$0.50'],
        ])
      })
    })
  })

  describe('GIVEN the non-tier models', () => {
    describe('WHEN a standard rate renders', () => {
      it('THEN shows its amount', () => {
        renderSwitch(RateCardRateModelEnum.Standard, buildRateProperties({ amount: '10' }))

        expect(getBodyRowTexts()).toEqual([['$10.00']])
      })
    })

    describe('WHEN a package rate renders', () => {
      it('THEN shows the amount, the package size and the free units', () => {
        renderSwitch(
          RateCardRateModelEnum.Package,
          buildRateProperties({ amount: '5', packageSize: 100, freeUnits: 10 }),
        )

        expect(getBodyRowTexts()).toEqual([['$5.00', '100', '10']])
      })
    })

    describe('WHEN a percentage rate renders', () => {
      it('THEN shows the percentage table', () => {
        renderSwitch(
          RateCardRateModelEnum.Percentage,
          buildRateProperties({ amount: null, rate: '1.5', fixedAmount: '2' }),
        )

        expect(getBodyRowTexts()).toEqual([['1.50%', '$2.00', '0', '$0.00']])
      })
    })

    describe('WHEN a custom rate renders', () => {
      it('THEN hands its custom properties to the read-only editor', () => {
        renderSwitch(
          RateCardRateModelEnum.Custom,
          buildRateProperties({ amount: null, customProperties: { tier: 'gold' } }),
        )

        expect(screen.getByTestId(mockJsonEditorTestId)).toHaveTextContent('{"tier":"gold"}')
      })
    })

    describe('WHEN a dynamic rate renders', () => {
      it('THEN shows the dynamic pricing notice', () => {
        renderSwitch(RateCardRateModelEnum.Dynamic, buildRateProperties({ amount: null }))

        expect(screen.getByTestId(mockDynamicChargeTestId)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN pricing group keys', () => {
    describe('WHEN the rate renders', () => {
      it('THEN shows a chip per key', () => {
        renderSwitch(
          RateCardRateModelEnum.Standard,
          buildRateProperties({ pricingGroupKeys: ['region'] }),
        )

        expect(screen.getByText('region')).toBeInTheDocument()
      })
    })
  })
})
