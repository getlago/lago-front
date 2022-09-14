import _omit from 'lodash/omit'

import { PlanFormInput, LocalChargeInput } from '~/components/plans/types'
import { ChargeModelEnum, OverridePlanFragment, ChargeInput, PlanInput } from '~/generated/graphql'

const serializeChargesInput: (charge: LocalChargeInput) => ChargeInput = ({
  billableMetric,
  amount: chargeAmount,
  graduatedRanges,
  volumeRanges,
  chargeModel,
  freeUnits,
  freeUnitsPerEvents,
  ...charge
}) => {
  return {
    chargeModel,
    billableMetricId: billableMetric.id,
    ...(chargeModel === ChargeModelEnum.Graduated
      ? {
          graduatedRanges: (graduatedRanges || []).map(
            ({ flatAmount, fromValue, perUnitAmount, ...range }) => ({
              flatAmount: String(flatAmount || '0'),
              fromValue: fromValue || 0,
              perUnitAmount: String(perUnitAmount || '0'),
              ...range,
            })
          ),
        }
      : { amount: chargeAmount }),
    ...(chargeModel === ChargeModelEnum.Volume
      ? {
          volumeRanges: (volumeRanges || []).map(
            ({ flatAmount, fromValue, perUnitAmount, ...range }) => ({
              flatAmount: String(flatAmount || '0'),
              fromValue: fromValue || 0,
              perUnitAmount: String(perUnitAmount || '0'),
              ...range,
            })
          ),
        }
      : { amount: chargeAmount }),
    ...(chargeModel === ChargeModelEnum.Package ? { freeUnits: freeUnits || 0 } : {}),
    ...(chargeModel === ChargeModelEnum.Percentage
      ? { freeUnitsPerEvents: Number(freeUnitsPerEvents) || undefined }
      : {}),
    ...charge,
  }
}

export const serializePlanCreateInput: (
  values: PlanFormInput | OverridePlanFragment
) => PlanInput = (values) => {
  const { amountCents, trialPeriod, charges, ...otherValues } = _omit(values, [
    'id',
    'canBeDeleted',
  ]) as PlanFormInput

  return {
    amountCents: Math.round(Number(amountCents) * 100),
    trialPeriod: Number(trialPeriod || 0),
    charges: charges?.map((charge) => serializeChargesInput(charge)) || [],
    ...otherValues,
  }
}
