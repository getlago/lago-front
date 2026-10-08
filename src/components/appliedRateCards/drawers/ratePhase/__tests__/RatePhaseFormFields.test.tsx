import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { RATE_PHASE_FORM_DEFAULTS } from '../ratePhaseFormSchema'
import { RatePhaseFormFields } from '../RatePhaseFormFields'
import { RateCardForRatePhaseFields } from '../types'

const rateCardForFields: RateCardForRatePhaseFields = {
  productType: ProductTypeEnum.Metered,
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  rateModelConfiguration: undefined,
}

const Host = ({
  isLastPosition,
  rateCard = rateCardForFields,
}: {
  isLastPosition: boolean
  rateCard?: RateCardForRatePhaseFields
}) => {
  const form = useAppForm({ defaultValues: RATE_PHASE_FORM_DEFAULTS })

  return <RatePhaseFormFields form={form} isLastPosition={isLastPosition} rateCard={rateCard} />
}

describe('RatePhaseFormFields', () => {
  it('GIVEN override toggle OFF THEN no override fields render', () => {
    render(<Host isLastPosition />)

    expect(screen.queryByText('Model')).not.toBeInTheDocument()
  })

  it('GIVEN override toggle turned ON THEN the override fields render', async () => {
    render(<Host isLastPosition />)

    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))

    await waitFor(() => expect(screen.getByText('Model')).toBeInTheDocument())
  })

  it('GIVEN override toggle turned ON then OFF THEN the rate model resets to the default', async () => {
    render(<Host isLastPosition />)

    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))
    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))
    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))

    await waitFor(() => expect(screen.getByText('Model')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Standard')).toBeInTheDocument()
  })

  it('GIVEN billingTiming advance THEN min amount never renders', async () => {
    render(
      <Host
        isLastPosition
        rateCard={{ ...rateCardForFields, billingTiming: RateCardBillingTimingEnum.Advance }}
      />,
    )

    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))

    expect(screen.queryByTestId('rate-phase-min-amount')).not.toBeInTheDocument()
  })

  it('GIVEN rateCard has an appliedPricingUnitCode THEN the conversion rate field renders', async () => {
    render(
      <Host isLastPosition rateCard={{ ...rateCardForFields, appliedPricingUnitCode: 'usd-cents' }} />,
    )

    await userEvent.click(screen.getByTestId('rate-phase-override-toggle'))

    expect(screen.getByTestId('rate-phase-conversion-rate')).toBeInTheDocument()
  })

  it('GIVEN isLastPosition true THEN the duration toggle is disabled on finite', () => {
    render(<Host isLastPosition />)

    expect(screen.getByTestId('button-selector-finite')).toBeDisabled()
  })

  it('GIVEN isLastPosition false THEN the cycle count input renders and the toggle is disabled on forever', () => {
    render(<Host isLastPosition={false} />)

    expect(screen.getByTestId('button-selector-forever')).toBeDisabled()
    expect(screen.getByTestId('rate-phase-duration-cycle-count')).toBeInTheDocument()
  })
})
