import { z } from 'zod'

import {
  LocalFixedChargeInput,
  LocalUsageChargeInput,
  LocalUsageThresholdInput,
  PlanFormInput,
} from '~/components/plans/types'
import { CurrencyEnum, PlanInterval } from '~/generated/graphql'

import { PropertiesZodInput, validateChargeProperties } from './chargePropertiesSchema'

// --- Individual field validators ---

function validateUsageCharges(charges: LocalUsageChargeInput[], ctx: z.RefinementCtx) {
  for (let i = 0; i < charges.length; i++) {
    const charge = charges[i]

    if (charge.properties) {
      validateChargeProperties(charge.chargeModel, charge.properties as PropertiesZodInput, ctx, [
        'charges',
        String(i),
        'properties',
      ])
    }

    if (charge.filters?.length) {
      for (let fi = 0; fi < charge.filters.length; fi++) {
        validateChargeProperties(
          charge.chargeModel,
          charge.filters[fi].properties as PropertiesZodInput,
          ctx,
          ['charges', String(i), 'filters', String(fi), 'properties'],
        )

        if (!charge.filters[fi].values?.length) {
          ctx.addIssue({
            code: 'custom',
            message: '',
            path: ['charges', String(i), 'filters', String(fi), 'values'],
          })
        }
      }
    }
  }
}

function validateFixedCharges(charges: LocalFixedChargeInput[], ctx: z.RefinementCtx) {
  for (let i = 0; i < charges.length; i++) {
    const charge = charges[i]

    if (charge.properties) {
      validateChargeProperties(charge.chargeModel, charge.properties as PropertiesZodInput, ctx, [
        'fixedCharges',
        String(i),
        'properties',
      ])
    }

    if (!charge.units || Number.isNaN(Number(charge.units))) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_624ea7c29103fd010732ab7d',
        path: ['fixedCharges', String(i), 'units'],
      })
    }
  }
}

function validateMinimumCommitment(
  commitment: PlanFormInput['minimumCommitment'],
  ctx: z.RefinementCtx,
) {
  if (!commitment || !Object.keys(commitment).length) return

  if (!Number(commitment.amountCents)) {
    ctx.addIssue({
      code: 'custom',
      message: 'text_624ea7c29103fd010732ab7d',
      path: ['minimumCommitment', 'amountCents'],
    })
  }
}

function validateNonRecurringThresholds(
  thresholds: LocalUsageThresholdInput[] | undefined,
  ctx: z.RefinementCtx,
) {
  if (!thresholds) return

  if (thresholds.length === 0) {
    ctx.addIssue({ code: 'custom', message: '', path: ['nonRecurringUsageThresholds'] })
    return
  }

  for (let i = 0; i < thresholds.length; i++) {
    const { amountCents } = thresholds[i]

    if (amountCents === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: '',
        path: ['nonRecurringUsageThresholds', String(i), 'amountCents'],
      })
      return
    }

    if (i === 0 && Number(amountCents) <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: '',
        path: ['nonRecurringUsageThresholds', String(i), 'amountCents'],
      })
      return
    }

    const prev = thresholds[i - 1]

    if (prev && Number(amountCents) <= Number(prev.amountCents)) {
      ctx.addIssue({
        code: 'custom',
        message: '',
        path: ['nonRecurringUsageThresholds', String(i), 'amountCents'],
      })
      return
    }
  }
}

function validateRecurringThreshold(
  threshold: PlanFormInput['recurringUsageThreshold'],
  ctx: z.RefinementCtx,
) {
  if (!threshold) return

  if (!threshold.amountCents || Number(threshold.amountCents) <= 0) {
    ctx.addIssue({
      code: 'custom',
      message: '',
      path: ['recurringUsageThreshold', 'amountCents'],
    })
  }
}

// --- Full Plan Form Schema ---

// We use z.custom<PlanFormInput>() because PlanFormInput has complex nested types
// (charges, filters, commitments) that don't map cleanly to z.object().
// All validation — including simple required fields — lives in superRefine.
export const planFormSchema = z.custom<PlanFormInput>().superRefine((data, ctx) => {
  // Required settings fields — always mandatory regardless of form state
  if (!data.name) {
    ctx.addIssue({ code: 'custom', message: 'text_624ea7c29103fd010732ab7d', path: ['name'] })
  }
  if (!data.code) {
    ctx.addIssue({ code: 'custom', message: 'text_624ea7c29103fd010732ab7d', path: ['code'] })
  }
  if (!data.interval || !Object.values(PlanInterval).includes(data.interval)) {
    ctx.addIssue({ code: 'custom', message: 'text_624ea7c29103fd010732ab7d', path: ['interval'] })
  }
  if (!data.amountCurrency || !Object.values(CurrencyEnum).includes(data.amountCurrency)) {
    ctx.addIssue({
      code: 'custom',
      message: 'text_624ea7c29103fd010732ab7d',
      path: ['amountCurrency'],
    })
  }

  // Charges
  validateUsageCharges(data.charges, ctx)
  validateFixedCharges(data.fixedCharges, ctx)

  // Commitments & Progressive billing
  validateMinimumCommitment(data.minimumCommitment, ctx)
  validateNonRecurringThresholds(data.nonRecurringUsageThresholds, ctx)
  validateRecurringThreshold(data.recurringUsageThreshold, ctx)
})
