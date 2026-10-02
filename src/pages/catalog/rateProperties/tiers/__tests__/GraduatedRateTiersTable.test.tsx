import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum, RateCardRateModelEnum, RatePropertiesInput } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  RATE_CARD_RATE_FORM_DEFAULTS,
  RateCardRateFormValues,
} from '~/pages/catalog/drawers/rateCardRate/constants'
import { render } from '~/test-utils'

import { GraduatedRateTiersTable } from '../GraduatedRateTiersTable'
import { RATE_TIER_FIRST_LABEL_KEY, RATE_TIER_NEXT_LABEL_KEY } from '../rateTiers'
import {
  getRateTierTestId,
  RATE_TIER_INFINITE_UP_TO_TEST_ID,
  RATE_TIER_LABEL_TEST_ID,
  RATE_TIER_PER_UNIT_TEST_ID,
  RATE_TIER_UP_TO_TEST_ID,
  RATE_TIERS_ADD_TIER_TEST_ID,
  RATE_TIERS_EXAMPLE_LINE_TEST_ID,
  RATE_TIERS_EXAMPLE_TOTAL_TEST_ID,
} from '../rateTiersTestIds'

const TIERS_PROBE_TEST_ID = 'tiers-probe'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}|${Object.values(vars).join('|')}` : key,
  }),
}))

const Host = ({
  properties = {},
  pricingUnitShortName,
}: {
  properties?: RatePropertiesInput
  pricingUnitShortName?: string
}) => {
  const defaultValues: RateCardRateFormValues = {
    ...RATE_CARD_RATE_FORM_DEFAULTS,
    rateModel: RateCardRateModelEnum.Graduated,
    properties,
  }
  const form = useAppForm({ defaultValues })

  return (
    <>
      <GraduatedRateTiersTable
        form={form}
        currency={CurrencyEnum.Usd}
        pricingUnitShortName={pricingUnitShortName}
      />
      <form.Subscribe selector={(state) => state.values.properties?.graduatedRanges}>
        {(tiers) => <span data-test={TIERS_PROBE_TEST_ID}>{JSON.stringify(tiers)}</span>}
      </form.Subscribe>
    </>
  )
}

const readTiers = (): unknown =>
  JSON.parse(screen.getByTestId(TIERS_PROBE_TEST_ID).textContent ?? 'null')

const twoTiers: RatePropertiesInput = {
  graduatedRanges: [
    { toValue: '10', perUnitAmount: '1', flatAmount: '2' },
    { toValue: null, perUnitAmount: '0.5', flatAmount: '0' },
  ],
}

describe('GraduatedRateTiersTable', () => {
  describe('GIVEN a rate without tiers', () => {
    describe('WHEN the table mounts', () => {
      it('THEN seeds an up-to-1 tier and an open tier', () => {
        render(<Host />)

        expect(readTiers()).toEqual([
          { toValue: '1', perUnitAmount: '', flatAmount: '' },
          { toValue: null, perUnitAmount: '', flatAmount: '' },
        ])
        expect(screen.getByTestId(RATE_TIERS_EXAMPLE_TOTAL_TEST_ID)).toHaveTextContent(
          'text_627b69c9fe95530136833956|2|$0.00',
        )
      })
    })
  })

  describe('GIVEN two tiers', () => {
    describe('WHEN the table renders', () => {
      it('THEN labels the rows and only the last one is open', () => {
        render(<Host properties={twoTiers} />)

        expect(screen.getByTestId(getRateTierTestId(RATE_TIER_LABEL_TEST_ID, 0))).toHaveTextContent(
          RATE_TIER_FIRST_LABEL_KEY,
        )
        expect(screen.getByTestId(getRateTierTestId(RATE_TIER_LABEL_TEST_ID, 1))).toHaveTextContent(
          RATE_TIER_NEXT_LABEL_KEY,
        )
        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIER_UP_TO_TEST_ID, 0)).querySelector('input'),
        ).toHaveValue('10')
        expect(screen.getByTestId(RATE_TIER_INFINITE_UP_TO_TEST_ID)).toHaveTextContent('∞')
        expect(
          screen.queryByTestId(getRateTierTestId(RATE_TIER_UP_TO_TEST_ID, 1)),
        ).not.toBeInTheDocument()
      })

      it('THEN explains the cost of one unit above the last bound', () => {
        render(<Host properties={twoTiers} />)

        expect(screen.getByTestId(RATE_TIERS_EXAMPLE_TOTAL_TEST_ID)).toHaveTextContent(
          'text_627b69c9fe95530136833956|11|$12.50',
        )
        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, 0)),
        ).toHaveTextContent('text_627b69c9fe95530136833958|10|$1.00|$2.00|$12.00')
        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, 1)),
        ).toHaveTextContent('text_627b69c9fe9553013683395a|1|$0.50|$0.00|$0.50')
      })
    })

    describe('WHEN a tier is added', () => {
      it('THEN inserts it before the open tier, one unit above the previous bound', async () => {
        render(<Host properties={twoTiers} />)

        await userEvent.click(screen.getByTestId(RATE_TIERS_ADD_TIER_TEST_ID))

        expect(readTiers()).toEqual([
          { toValue: '10', perUnitAmount: '1', flatAmount: '2' },
          { toValue: '11', perUnitAmount: '', flatAmount: '' },
          { toValue: null, perUnitAmount: '0.5', flatAmount: '0' },
        ])
      })
    })
  })

  describe('GIVEN a single open tier', () => {
    describe('WHEN the table renders', () => {
      it('THEN uses the single tier example copy', () => {
        render(
          <Host
            properties={{
              graduatedRanges: [{ toValue: null, perUnitAmount: '2', flatAmount: '1' }],
            }}
          />,
        )

        expect(screen.getByTestId(RATE_TIERS_EXAMPLE_TOTAL_TEST_ID)).toHaveTextContent(
          'text_627b69c9fe95530136833956|10|$21.00',
        )
        expect(
          screen.getByTestId(getRateTierTestId(RATE_TIERS_EXAMPLE_LINE_TEST_ID, 0)),
        ).toHaveTextContent('text_64cac576a11db000acb130b2|10|$2.00|$1.00|$21.00')
      })
    })
  })

  describe('GIVEN a card priced in a custom pricing unit', () => {
    describe('WHEN the table renders', () => {
      it('THEN prices the inputs and the example in the unit short name', () => {
        render(<Host pricingUnitShortName="tok" />)

        expect(
          within(screen.getByTestId(getRateTierTestId(RATE_TIER_PER_UNIT_TEST_ID, 0))).getByText(
            'tok',
          ),
        ).toBeInTheDocument()
        expect(screen.getByTestId(RATE_TIERS_EXAMPLE_TOTAL_TEST_ID)).toHaveTextContent('0 tok')
      })
    })
  })
})
