import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { CurrencyEnum, ProductTypeEnum, RateCardBillingTimingEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import {
  RATE_PHASE_DURATION_CYCLE_COUNT_TEST_ID,
  RATE_PHASE_FOREVER_CHECKBOX_TEST_ID,
  RATE_PHASE_POSITION_MODE_TEST_ID,
  RATE_PHASE_POSITION_REFERENCE_TEST_ID,
  RatePhaseFormFields,
} from '../RatePhaseFormFields'
import {
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormValues,
  RatePhaseReference,
} from '../ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from '../types'

jest.mock('~/components/form/ComboBox/ComboBox', () => {
  const { ComboBox } = jest.requireActual('~/components/form/ComboBox/ComboBox')

  return { ComboBox: (props: ComboBoxProps) => <ComboBox {...props} virtualized={false} /> }
})

const rateCardForFields: RateCardForRatePhaseFields = {
  productType: ProductTypeEnum.Metered,
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  rateModelConfiguration: undefined,
}

const OTHER_PHASES: RatePhaseReference[] = [
  { code: 'trial', name: 'Trial' },
  { code: 'standard', name: 'Standard' },
]

const DURATION_TYPE_PROBE_TEST_ID = 'duration-type-probe'

const Host = ({
  otherPhases = [],
  rateCard = rateCardForFields,
  defaultValues = RATE_PHASE_FORM_DEFAULTS,
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
        otherPhases={otherPhases}
        rateCard={rateCard}
      />
    </>
  )
}

const getForeverCheckbox = (): HTMLInputElement =>
  screen
    .getByTestId(RATE_PHASE_FOREVER_CHECKBOX_TEST_ID)
    .querySelector('input[type="checkbox"]') as HTMLInputElement

const getCycleCountInput = (): HTMLInputElement =>
  screen
    .getByTestId(RATE_PHASE_DURATION_CYCLE_COUNT_TEST_ID)
    .querySelector('input') as HTMLInputElement

describe('RatePhaseFormFields', () => {
  it('GIVEN override toggle OFF THEN no override fields render', () => {
    render(<Host />)

    expect(screen.queryByText('Model')).not.toBeInTheDocument()
  })

  it('GIVEN override toggle turned ON THEN the override fields render', async () => {
    render(<Host />)

    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))

    await waitFor(() => expect(screen.getByText('Model')).toBeInTheDocument())
  })

  it('GIVEN override toggle turned ON then OFF THEN the rate model resets to the default', async () => {
    render(<Host />)

    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))
    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))
    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))

    await waitFor(() => expect(screen.getByText('Model')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Standard')).toBeInTheDocument()
  })

  it('GIVEN billingTiming advance THEN min amount never renders', async () => {
    render(
      <Host
        rateCard={{ ...rateCardForFields, billingTiming: RateCardBillingTimingEnum.Advance }}
      />,
    )

    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))

    expect(screen.queryByTestId('rate-phase-min-amount')).not.toBeInTheDocument()
  })

  it('GIVEN rateCard has an appliedPricingUnitCode THEN the conversion rate field renders', async () => {
    render(<Host rateCard={{ ...rateCardForFields, appliedPricingUnitCode: 'usd-cents' }} />)

    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))

    expect(screen.getByTestId('rate-phase-conversion-rate')).toBeInTheDocument()
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
