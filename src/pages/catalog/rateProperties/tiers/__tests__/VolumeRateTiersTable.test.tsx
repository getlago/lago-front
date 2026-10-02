import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum, RateCardRateModelEnum, RatePropertiesInput } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  RATE_CARD_RATE_FORM_DEFAULTS,
  RateCardRateFormValues,
} from '~/pages/catalog/drawers/rateCardRate/constants'
import { render } from '~/test-utils'

import { RATE_TIER_TOTAL_UNITS_LABEL_KEY } from '../rateTiers'
import {
  getRateTierTestId,
  RATE_TIER_INFINITE_UP_TO_TEST_ID,
  RATE_TIER_LABEL_TEST_ID,
  RATE_TIERS_ADD_TIER_TEST_ID,
  RATE_TIERS_EXAMPLE_LINE_TEST_ID,
  RATE_TIERS_EXAMPLE_TOTAL_TEST_ID,
} from '../rateTiersTestIds'
import { VolumeRateTiersTable } from '../VolumeRateTiersTable'

const TIERS_PROBE_TEST_ID = 'tiers-probe'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}|${Object.values(vars).join('|')}` : key,
  }),
}))

const Host = ({ properties = {} }: { properties?: RatePropertiesInput }) => {
  const defaultValues: RateCardRateFormValues = {
    ...RATE_CARD_RATE_FORM_DEFAULTS,
    rateModel: RateCardRateModelEnum.Volume,
    properties,
  }
  const form = useAppForm({ defaultValues })

  return (
    <>
      <VolumeRateTiersTable
        form={form}
        currency={CurrencyEnum.Usd}
        pricingUnitShortName={undefined}
      />
      <form.Subscribe selector={(state) => state.values.properties?.volumeRanges}>
        {(tiers) => <span data-test={TIERS_PROBE_TEST_ID}>{JSON.stringify(tiers)}</span>}
      </form.Subscribe>
    </>
  )
}

const readTiers = (): unknown =>
  JSON.parse(screen.getByTestId(TIERS_PROBE_TEST_ID).textContent ?? 'null')

const twoTiers: RatePropertiesInput = {
  volumeRanges: [
    { toValue: '100', perUnitAmount: '1', flatAmount: '0' },
    { toValue: null, perUnitAmount: '0.2', flatAmount: '1' },
  ],
}

describe('VolumeRateTiersTable', () => {
  describe('GIVEN a rate without tiers', () => {
    describe('WHEN the table mounts', () => {
      it('THEN seeds an up-to-1 tier and an open tier', () => {
        render(<Host />)

        expect(readTiers()).toEqual([
          { toValue: '1', perUnitAmount: '', flatAmount: '' },
          { toValue: null, perUnitAmount: '', flatAmount: '' },
        ])
      })
    })
  })

  describe('GIVEN two tiers', () => {
    describe('WHEN the table renders', () => {
      it('THEN labels every row with total units and only the last one is open', () => {
        render(<Host properties={twoTiers} />)

        expect(screen.getByTestId(getRateTierTestId(RATE_TIER_LABEL_TEST_ID, 0))).toHaveTextContent(
          RATE_TIER_TOTAL_UNITS_LABEL_KEY,
        )
        expect(screen.getByTestId(getRateTierTestId(RATE_TIER_LABEL_TEST_ID, 1))).toHaveTextContent(
          RATE_TIER_TOTAL_UNITS_LABEL_KEY,
        )
        expect(screen.getByTestId(RATE_TIER_INFINITE_UP_TO_TEST_ID)).toHaveTextContent('∞')
      })

      it('THEN prices one unit above the last bound with the open tier', () => {
        render(<Host properties={twoTiers} />)

        expect(screen.getByTestId(RATE_TIERS_EXAMPLE_TOTAL_TEST_ID)).toHaveTextContent(
          'text_6304e74aab6dbc18d615f412|101|$21.20',
        )
        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, 0)),
        ).toHaveTextContent('text_6304e74aab6dbc18d615f416|101|$0.20|$1.00|$21.20')
      })
    })

    describe('WHEN a tier is added', () => {
      it('THEN inserts it one unit above the previous bound', async () => {
        render(<Host properties={twoTiers} />)

        await userEvent.click(screen.getByTestId(RATE_TIERS_ADD_TIER_TEST_ID))

        expect(readTiers()).toEqual([
          { toValue: '100', perUnitAmount: '1', flatAmount: '0' },
          { toValue: '101', perUnitAmount: '', flatAmount: '' },
          { toValue: null, perUnitAmount: '0.2', flatAmount: '1' },
        ])
      })
    })
  })
})
