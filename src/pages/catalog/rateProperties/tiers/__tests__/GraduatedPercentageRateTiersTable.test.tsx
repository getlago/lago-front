import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum, RateCardRateModelEnum, RatePropertiesInput } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  RATE_CARD_RATE_FORM_DEFAULTS,
  RateCardRateFormValues,
} from '~/pages/catalog/drawers/rateCardRate/constants'
import { render } from '~/test-utils'

import { GraduatedPercentageRateTiersTable } from '../GraduatedPercentageRateTiersTable'
import { RATE_TIER_FIRST_LABEL_KEY, RATE_TIER_NEXT_LABEL_KEY } from '../rateTiers'
import {
  getRateTierTestId,
  RATE_TIER_INFINITE_UP_TO_TEST_ID,
  RATE_TIER_LABEL_TEST_ID,
  RATE_TIER_RATE_TEST_ID,
  RATE_TIERS_ADD_TIER_TEST_ID,
  RATE_TIERS_EXAMPLE_LINE_TEST_ID,
} from '../rateTiersTestIds'

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
    rateModel: RateCardRateModelEnum.GraduatedPercentage,
    properties,
  }
  const form = useAppForm({ defaultValues })

  return (
    <>
      <GraduatedPercentageRateTiersTable
        form={form}
        currency={CurrencyEnum.Usd}
        pricingUnitShortName={undefined}
      />
      <form.Subscribe selector={(state) => state.values.properties?.graduatedPercentageRanges}>
        {(tiers) => <span data-test={TIERS_PROBE_TEST_ID}>{JSON.stringify(tiers)}</span>}
      </form.Subscribe>
    </>
  )
}

const readTiers = (): unknown =>
  JSON.parse(screen.getByTestId(TIERS_PROBE_TEST_ID).textContent ?? 'null')

const twoTiers: RatePropertiesInput = {
  graduatedPercentageRanges: [
    { toValue: '1000', rate: '5', flatAmount: '1' },
    { toValue: null, rate: '3', flatAmount: '0' },
  ],
}

describe('GraduatedPercentageRateTiersTable', () => {
  describe('GIVEN a rate without tiers', () => {
    describe('WHEN the table mounts', () => {
      it('THEN seeds an up-to-1 tier and an open tier', () => {
        render(<Host />)

        expect(readTiers()).toEqual([
          { toValue: '1', rate: '', flatAmount: '' },
          { toValue: null, rate: '', flatAmount: '' },
        ])
      })
    })
  })

  describe('GIVEN two tiers', () => {
    describe('WHEN the table renders', () => {
      it('THEN labels the rows, edits the rates and keeps the last tier open', () => {
        render(<Host properties={twoTiers} />)

        expect(screen.getByTestId(getRateTierTestId(RATE_TIER_LABEL_TEST_ID, 0))).toHaveTextContent(
          RATE_TIER_FIRST_LABEL_KEY,
        )
        expect(screen.getByTestId(getRateTierTestId(RATE_TIER_LABEL_TEST_ID, 1))).toHaveTextContent(
          RATE_TIER_NEXT_LABEL_KEY,
        )
        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIER_RATE_TEST_ID, 0)).querySelector('input'),
        ).toHaveValue('5')
        expect(screen.getByTestId(RATE_TIER_INFINITE_UP_TO_TEST_ID)).toHaveTextContent('∞')
      })

      it('THEN explains each tier in percent', () => {
        render(<Host properties={twoTiers} />)

        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, 0)),
        ).toHaveTextContent('text_64de472563e2da6b31737e6f|1000|5.00%|$1.00')
        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, 1)),
        ).toHaveTextContent('text_64de472563e2da6b31737e75|1000|3.00%|$0.00')
      })
    })

    describe('WHEN a tier is added', () => {
      it('THEN inserts it one unit above the previous bound', async () => {
        render(<Host properties={twoTiers} />)

        await userEvent.click(screen.getByTestId(RATE_TIERS_ADD_TIER_TEST_ID))

        expect(readTiers()).toEqual([
          { toValue: '1000', rate: '5', flatAmount: '1' },
          { toValue: '1001', rate: '', flatAmount: '' },
          { toValue: null, rate: '3', flatAmount: '0' },
        ])
      })
    })
  })

  describe('GIVEN tiers priced at 8.2% and 12.3%', () => {
    describe('WHEN the table renders', () => {
      it('THEN explains each tier in percent without float noise', () => {
        render(
          <Host
            properties={{
              graduatedPercentageRanges: [
                { toValue: '1000', rate: '8.2', flatAmount: '0' },
                { toValue: null, rate: '12.3', flatAmount: '0' },
              ],
            }}
          />,
        )

        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, 0)),
        ).toHaveTextContent('text_64de472563e2da6b31737e6f|1000|8.20%|$0.00')
        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, 1)),
        ).toHaveTextContent('text_64de472563e2da6b31737e75|1000|12.30%|$0.00')
      })
    })
  })

  describe('GIVEN a single open tier', () => {
    describe('WHEN the table renders', () => {
      it('THEN uses the all-units copy', () => {
        render(
          <Host
            properties={{
              graduatedPercentageRanges: [{ toValue: null, rate: '3', flatAmount: '0' }],
            }}
          />,
        )

        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, 0)),
        ).toHaveTextContent('text_64de5dd470cdf80100c15fdb|3.00%|$0.00')
      })
    })
  })
})
