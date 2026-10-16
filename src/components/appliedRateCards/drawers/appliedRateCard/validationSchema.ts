import { z } from 'zod'

import { CreatePlanAppliedRateCardInput, CurrencyEnum } from '~/generated/graphql'

import { mapFromFormToApi as mapPhaseFromFormToApi } from '../ratePhase/mappers'
import { RatePhaseFormValues } from '../ratePhase/ratePhaseFormSchema'

export interface AppliedRateCardDrawerValues {
  productId: string
  productFilterId: string
  rateCardId: string
  ratePhases: RatePhaseFormValues[]
}

export const APPLIED_RATE_CARD_FORM_DEFAULTS: AppliedRateCardDrawerValues = {
  productId: '',
  productFilterId: '',
  rateCardId: '',
  ratePhases: [],
}

// No return type: `z.ZodType<AppliedRateCardDrawerValues>` widens the input to `unknown`, which
// `validators.onDynamic` rejects.
export const buildAppliedRateCardFormSchema = () =>
  z.custom<AppliedRateCardDrawerValues>().superRefine((values, ctx) => {
    if (!values.productId) {
      ctx.addIssue({
        code: 'custom',
        path: ['productId'],
        message: 'text_1771342994699klxu2paz7g8',
      })
    }

    if (!values.rateCardId) {
      ctx.addIssue({
        code: 'custom',
        path: ['rateCardId'],
        message: 'text_1771342994699klxu2paz7g8',
      })
    }

    const lastPhase = values.ratePhases.at(-1)

    if (values.ratePhases.slice(0, -1).some((phase) => phase.durationType === 'forever')) {
      ctx.addIssue({
        code: 'custom',
        path: ['ratePhases'],
        message: 'text_17918352599305ihwwvq7fyq',
      })
    }

    if (lastPhase && lastPhase.durationType !== 'forever') {
      ctx.addIssue({
        code: 'custom',
        path: ['ratePhases'],
        message: 'text_1791485670326tpf0gnrctv6',
      })
    }
  })

export const mapFromFormToApi = (
  values: AppliedRateCardDrawerValues,
  currency: CurrencyEnum,
): Pick<CreatePlanAppliedRateCardInput, 'rateCardCode' | 'ratePhases'> => ({
  rateCardCode: values.rateCardId,
  ...(values.ratePhases.length > 0
    ? {
        ratePhases: values.ratePhases.map((phase, index) =>
          mapPhaseFromFormToApi({ ...phase, position: index + 1 }, currency),
        ),
      }
    : {}),
})
