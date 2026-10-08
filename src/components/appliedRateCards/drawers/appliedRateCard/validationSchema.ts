import { z } from 'zod'

import {
  CreateContractAppliedRateCardInput,
  CreatePlanAppliedRateCardInput,
} from '~/generated/graphql'

import { buildPhaseInput, RatePhaseFormValues } from '../ratePhase/ratePhaseFormSchema'

export interface AppliedRateCardDrawerValues {
  productId: string
  productFilterId: string
  rateCardId: string
  units: string
  billingAnchorDate: string
  ratePhases: RatePhaseFormValues[]
}

export const APPLIED_RATE_CARD_FORM_DEFAULTS: AppliedRateCardDrawerValues = {
  productId: '',
  productFilterId: '',
  rateCardId: '',
  units: '',
  billingAnchorDate: '',
  ratePhases: [],
}

// No explicit return type, matching `buildRatePhaseFormSchema`/`buildRateCardRateSchema`/
// `planFormSchema`/`contractSchema`: annotating `z.ZodType<AppliedRateCardDrawerValues>` widens
// the Standard Schema input generic to `unknown`, which `useAppForm`'s `validators.onDynamic`
// then rejects.
export const buildAppliedRateCardFormSchema = () =>
  z.custom<AppliedRateCardDrawerValues>().superRefine((values, ctx) => {
    if (!values.productId) {
      ctx.addIssue({
        code: 'custom',
        path: ['productId'],
        message: 'text_626162c62f790600f850b76a',
      })
    }

    if (!values.rateCardId) {
      ctx.addIssue({
        code: 'custom',
        path: ['rateCardId'],
        message: 'text_626162c62f790600f850b76a',
      })
    }

    const lastPhase = values.ratePhases.at(-1)

    if (lastPhase && lastPhase.durationType !== 'forever') {
      ctx.addIssue({
        code: 'custom',
        path: ['ratePhases'],
        message: 'text_17951541055447xojz4p5i89',
      })
    }
  })

export const buildCreatePlanAppliedRateCardInput = (
  values: AppliedRateCardDrawerValues,
  planId: string,
): CreatePlanAppliedRateCardInput => ({
  planId,
  rateCardCode: values.rateCardId,
  units: values.units ? Number(values.units) : undefined,
  ...(values.ratePhases.length > 0
    ? {
        ratePhases: values.ratePhases.map((phase, index) =>
          buildPhaseInput({ ...phase, position: index + 1 }),
        ),
      }
    : {}),
})

export const buildCreateContractAppliedRateCardInput = (
  values: AppliedRateCardDrawerValues,
  contractExternalId: string,
): CreateContractAppliedRateCardInput => ({
  externalId: contractExternalId,
  rateCardCode: values.rateCardId,
  units: values.units ? Number(values.units) : undefined,
  billingAnchorDate: values.billingAnchorDate || undefined,
  ...(values.ratePhases.length > 0
    ? {
        ratePhases: values.ratePhases.map((phase, index) =>
          buildPhaseInput({ ...phase, position: index + 1 }),
        ),
      }
    : {}),
})
