import { withForm } from '~/hooks/forms/useAppform'

import { RatePhaseFormFields } from './RatePhaseFormFields'
import { RATE_PHASE_FORM_DEFAULTS } from './ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from './types'

type RatePhaseDrawerContentProps = {
  isLastPosition: boolean
  rateCard: RateCardForRatePhaseFields
}

export const RatePhaseDrawerContent = withForm({
  defaultValues: RATE_PHASE_FORM_DEFAULTS,
  props: {
    isLastPosition: true,
    rateCard: {} as RateCardForRatePhaseFields,
  } as RatePhaseDrawerContentProps,
  render: function RatePhaseDrawerContentRender({ form, isLastPosition, rateCard }) {
    return <RatePhaseFormFields form={form} isLastPosition={isLastPosition} rateCard={rateCard} />
  },
})
