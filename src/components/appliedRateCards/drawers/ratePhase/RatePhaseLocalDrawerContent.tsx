import { withForm } from '~/hooks/forms/useAppform'

import { RATE_PHASE_FORM_DEFAULTS } from './ratePhaseFormSchema'
import { RatePhaseFormFields } from './RatePhaseFormFields'
import { RateCardForRatePhaseFields } from './types'

type RatePhaseLocalDrawerContentProps = {
  isLastPosition: boolean
  rateCard: RateCardForRatePhaseFields
}

export const RatePhaseLocalDrawerContent = withForm({
  defaultValues: RATE_PHASE_FORM_DEFAULTS,
  props: {
    isLastPosition: true,
    rateCard: {} as RateCardForRatePhaseFields,
  } as RatePhaseLocalDrawerContentProps,
  render: function RatePhaseLocalDrawerContentRender({ form, isLastPosition, rateCard }) {
    return <RatePhaseFormFields form={form} isLastPosition={isLastPosition} rateCard={rateCard} />
  },
})
