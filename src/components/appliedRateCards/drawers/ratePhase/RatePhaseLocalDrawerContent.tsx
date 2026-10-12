import { withForm } from '~/hooks/forms/useAppform'

import { RatePhaseFormFields } from './RatePhaseFormFields'
import { RATE_PHASE_FORM_DEFAULTS, RatePhaseReference } from './ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from './types'

type RatePhaseLocalDrawerContentProps = {
  title: string
  otherPhases: RatePhaseReference[]
  rateCard: RateCardForRatePhaseFields
}

export const RatePhaseLocalDrawerContent = withForm({
  defaultValues: RATE_PHASE_FORM_DEFAULTS,
  props: {
    title: '',
    otherPhases: [],
    rateCard: {} as RateCardForRatePhaseFields,
  } as RatePhaseLocalDrawerContentProps,
  render: function RatePhaseLocalDrawerContentRender({ form, title, otherPhases, rateCard }) {
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
