import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ComboBoxProps } from '~/components/form/ComboBox/types'
import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_COUNT_TEST_ID,
  RATE_CARD_RATE_DRAWER_CONVERSION_RATE_TEST_ID,
  RATE_CARD_RATE_DRAWER_SPENDING_MINIMUM_TEST_ID,
} from '~/pages/catalog/drawers/rateCardRate/RateCardRateFieldGroups'
import { render } from '~/test-utils'

import {
  RATE_PHASE_DURATION_CYCLE_COUNT_TEST_ID,
  RATE_PHASE_FOREVER_CHECKBOX_TEST_ID,
  RATE_PHASE_OVERRIDE_TOGGLE_TEST_ID,
  RATE_PHASE_POSITION_MODE_TEST_ID,
  RATE_PHASE_POSITION_REFERENCE_TEST_ID,
  RatePhaseFormFields,
} from '../RatePhaseFormFields'
import {
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormValues,
  RatePhaseReference,
} from '../ratePhaseFormSchema'
import { buildCreatePhaseSeed } from '../ratePhaseSeeds'
import { RateCardForRatePhaseFields } from '../types'

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/components/form/ComboBox/ComboBox', () => {
  const { ComboBox } = jest.requireActual('~/components/form/ComboBox/ComboBox')

  return { ComboBox: (props: ComboBoxProps) => <ComboBox {...props} virtualized={false} /> }
})

const rateCardForFields: RateCardForRatePhaseFields = {
  productType: ProductTypeEnum.Fixed,
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  proration: false,
  activeRate: {
    id: 'active-rate',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    rateModel: RateCardRateModelEnum.Standard,
    billingIntervalCount: 2,
    billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Week,
    minAmountCents: '0',
    appliedPricingUnitConversionRate: null,
    rateProperties: { amount: '10' },
  },
}

const OTHER_PHASES: RatePhaseReference[] = [
  { code: 'trial', name: 'Trial' },
  { code: 'standard', name: 'Standard' },
]

const DURATION_TYPE_PROBE_TEST_ID = 'duration-type-probe'

const Host = ({
  otherPhases = [],
  rateCard = rateCardForFields,
  defaultValues = buildCreatePhaseSeed(otherPhases, rateCard),
}: {
  otherPhases?: RatePhaseReference[]
  rateCard?: RateCardForRatePhaseFields
  defaultValues?: RatePhaseFormValues
}) => {
  const form = useAppForm({ defaultValues })

  return (
    <>
      <form.Subscribe selector={(state) => state.values.durationType}>
        {(durationType) => <output data-test={DURATION_TYPE_PROBE_TEST_ID}>{durationType}</output>}
      </form.Subscribe>
      <RatePhaseFormFields
        form={form}
        title="Create a phase"
        isEdition={false}
        getOtherPhases={() => otherPhases}
        rateCard={rateCard}
      />
    </>
  )
}

const getForeverCheckbox = (): HTMLInputElement =>
  screen
    .getByTestId(RATE_PHASE_FOREVER_CHECKBOX_TEST_ID)
    .querySelector('input[type="checkbox"]') as HTMLInputElement

const getBillingIntervalCountInput = (): HTMLInputElement =>
  screen
    .getByTestId(RATE_CARD_RATE_DRAWER_BILLING_INTERVAL_COUNT_TEST_ID)
    .querySelector('input') as HTMLInputElement

const getCycleCountInput = (): HTMLInputElement =>
  screen
    .getByTestId(RATE_PHASE_DURATION_CYCLE_COUNT_TEST_ID)
    .querySelector('input') as HTMLInputElement

describe('RatePhaseFormFields', () => {
  it('GIVEN override toggle OFF THEN the rate fields show the active rate, read-only', () => {
    render(<Host />)

    expect(getBillingIntervalCountInput()).toHaveValue('2')
    expect(getBillingIntervalCountInput()).toBeDisabled()
  })

  it('GIVEN override toggle turned ON THEN the rate fields become editable', async () => {
    render(<Host />)

    await userEvent.click(screen.getByTestId(RATE_PHASE_OVERRIDE_TOGGLE_TEST_ID))

    await waitFor(() => expect(getBillingIntervalCountInput()).toBeEnabled())
    expect(getBillingIntervalCountInput()).toHaveValue('2')
  })

  it('GIVEN an overridden value WHEN the override is turned OFF THEN the active rate value is restored', async () => {
    render(<Host />)

    await userEvent.click(screen.getByTestId(RATE_PHASE_OVERRIDE_TOGGLE_TEST_ID))
    await userEvent.clear(getBillingIntervalCountInput())
    await userEvent.type(getBillingIntervalCountInput(), '6')
    await userEvent.click(screen.getByTestId(RATE_PHASE_OVERRIDE_TOGGLE_TEST_ID))

    await waitFor(() => expect(getBillingIntervalCountInput()).toHaveValue('2'))
    expect(getBillingIntervalCountInput()).toBeDisabled()
  })

  it('GIVEN billingTiming advance THEN the spending minimum never renders', () => {
    render(
      <Host
        rateCard={{ ...rateCardForFields, billingTiming: RateCardBillingTimingEnum.Advance }}
      />,
    )

    expect(
      screen.queryByTestId(RATE_CARD_RATE_DRAWER_SPENDING_MINIMUM_TEST_ID),
    ).not.toBeInTheDocument()
  })

  it('GIVEN rateCard has an appliedPricingUnitCode THEN the conversion rate field renders', () => {
    render(<Host rateCard={{ ...rateCardForFields, appliedPricingUnitCode: 'usd-cents' }} />)

    expect(screen.getByTestId(RATE_CARD_RATE_DRAWER_CONVERSION_RATE_TEST_ID)).toBeInTheDocument()
  })

  it('GIVEN no other phase THEN the position fields do not render and the phase can run forever', () => {
    render(<Host />)

    expect(screen.queryByTestId(RATE_PHASE_POSITION_MODE_TEST_ID)).not.toBeInTheDocument()
    expect(getForeverCheckbox()).toBeChecked()
    expect(getForeverCheckbox()).toBeEnabled()
    expect(getCycleCountInput()).toBeDisabled()
  })

  it('GIVEN forever is unchecked THEN the cycle count input is enabled', async () => {
    render(<Host />)

    await userEvent.click(getForeverCheckbox())

    expect(screen.getByTestId(DURATION_TYPE_PROBE_TEST_ID)).toHaveTextContent('finite')
    expect(getCycleCountInput()).toBeEnabled()
  })

  it('GIVEN a phase placed before another one THEN the position fields render and forever is disabled', () => {
    render(
      <Host
        otherPhases={OTHER_PHASES}
        defaultValues={{
          ...RATE_PHASE_FORM_DEFAULTS,
          positionMode: 'before',
          positionReferenceCode: 'standard',
          durationType: 'finite',
        }}
      />,
    )

    expect(screen.getByTestId(RATE_PHASE_POSITION_MODE_TEST_ID)).toBeInTheDocument()
    expect(screen.getByTestId(RATE_PHASE_POSITION_REFERENCE_TEST_ID)).toBeInTheDocument()
    expect(getForeverCheckbox()).toBeDisabled()
  })

  it('GIVEN a forever phase moved before the last one THEN it switches to finite', async () => {
    render(
      <Host
        otherPhases={OTHER_PHASES}
        defaultValues={{
          ...RATE_PHASE_FORM_DEFAULTS,
          positionMode: 'after',
          positionReferenceCode: 'standard',
          durationType: 'forever',
        }}
      />,
    )

    expect(getForeverCheckbox()).toBeEnabled()

    const modeInput = screen
      .getByTestId(RATE_PHASE_POSITION_MODE_TEST_ID)
      .querySelector('input') as HTMLInputElement

    await userEvent.click(modeInput)
    await userEvent.click(await screen.findByText('Before'))

    await waitFor(() =>
      expect(screen.getByTestId(DURATION_TYPE_PROBE_TEST_ID)).toHaveTextContent('finite'),
    )
    expect(getForeverCheckbox()).toBeDisabled()
  })
})
