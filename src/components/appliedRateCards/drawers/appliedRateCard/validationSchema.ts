import { z } from 'zod'

import {
  CreateContractAppliedRateCardInput,
  CreatePlanAppliedRateCardInput,
  CurrencyEnum,
} from '~/generated/graphql'

import { buildPhaseInput, RatePhaseFormValues } from '../ratePhase/ratePhaseFormSchema'

export interface AppliedRateCardDrawerValues {
  productId: string
  productFilterId: string
  rateCardId: string
  // Set once a rate card is selected (mirrors `rateCardId`); `buildPhaseInput` needs it to
  // serialize a phase override's `minAmountCents` to the currency's smallest unit. No phase can
  // exist yet while this still holds its placeholder default - adding a phase is gated on a
  // rate card already being picked.
  currency: CurrencyEnum
  units: string
  billingAnchorDate: string
  ratePhases: RatePhaseFormValues[]
}

export const APPLIED_RATE_CARD_FORM_DEFAULTS: AppliedRateCardDrawerValues = {
  productId: '',
  productFilterId: '',
  rateCardId: '',
  currency: CurrencyEnum.Usd,
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

    if (lastPhase && lastPhase.durationType !== 'forever') {
      ctx.addIssue({
        code: 'custom',
        path: ['ratePhases'],
        message: 'text_1791485670326tpf0gnrctv6',
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
          buildPhaseInput({ ...phase, position: index + 1 }, values.currency),
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
          buildPhaseInput({ ...phase, position: index + 1 }, values.currency),
        ),
      }
    : {}),
})
