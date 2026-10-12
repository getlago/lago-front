import { withForm } from '~/hooks/forms/useAppform'

import { RatePhaseFormFields } from './RatePhaseFormFields'
import { RATE_PHASE_FORM_DEFAULTS, RatePhaseReference } from './ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from './types'

type RatePhaseDrawerContentProps = {
  title: string
  otherPhases: RatePhaseReference[]
  rateCard: RateCardForRatePhaseFields
}

export const RatePhaseDrawerContent = withForm({
  defaultValues: RATE_PHASE_FORM_DEFAULTS,
  props: {
    title: '',
    otherPhases: [],
    rateCard: {} as RateCardForRatePhaseFields,
  } as RatePhaseDrawerContentProps,
  render: function RatePhaseDrawerContentRender({ form, title, otherPhases, rateCard }) {
    return (
      <RatePhaseFormFields
        form={form}
        title={title}
        otherPhases={otherPhases}
        rateCard={rateCard}
      />
    )
  },
})
