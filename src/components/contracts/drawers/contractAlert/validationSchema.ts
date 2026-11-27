import { z } from 'zod'

import { isThresholdValueValid } from '~/components/alerts/Thresholds'
import { refineThresholdsNotifyOn } from '~/components/alerts/utils'
import { ScopeEntryFormValues } from '~/components/scope/scopeEntry'
import { ContractAlertTypeEnum, NotifyOnEnum, ThresholdInput } from '~/generated/graphql'

import { isWholeContractTaken, toScopeKey } from './alertScope'

const MANDATORY_ERROR = 'text_624ea7c29103fd010732ab7d'
const REQUIRED_ERROR = 'text_1771342994699klxu2paz7g8'
const POSITIVE_VALUE_ERROR = 'text_1795802708078t9ythhvdvd5'

export const SCOPE_ALREADY_TAKEN_ERROR = 'text_1795778599616lwvfo71dmzd'

export type ContractAlertFormValues = {
  name: string
  code: string
  alertType?: ContractAlertTypeEnum | ''
  scope: ScopeEntryFormValues | null
  thresholds: ThresholdInput[]
}

export const CONTRACT_ALERT_FORM_DEFAULTS: ContractAlertFormValues = {
  name: '',
  code: '',
  alertType: '',
  scope: null,
  thresholds: [{ code: '', recurring: false, value: '', notifyOn: [NotifyOnEnum.Triggered] }],
}

const isNumeric = (value: string): boolean => value !== '' && !Number.isNaN(Number(value))

const thresholdSchema = z.object({
  code: z.string().nullish(),
  recurring: z.boolean().nullish(),
  value: z.string().refine(isNumeric, { message: REQUIRED_ERROR }),
  notifyOn: z.array(z.enum(NotifyOnEnum)).nullish(),
})

const scopeSchema = z.object({
  type: z.string().optional(),
  productCode: z.string().optional(),
  productFilterCode: z.string().optional(),
  withProductFilters: z.boolean(),
  isFilterAdded: z.boolean().optional(),
})

const isThresholdValueInvalid = (
  { recurring, value }: ThresholdInput,
  index: number,
  thresholds: ThresholdInput[],
): boolean => {
  if (recurring) return isNumeric(value) && Number(value) <= 0

  return isThresholdValueValid(index, value, thresholds)
}

const refineThresholdValues = (thresholds: ThresholdInput[], ctx: z.RefinementCtx): void => {
  thresholds.forEach((threshold, index) => {
    if (!isThresholdValueInvalid(threshold, index, thresholds)) return

    ctx.addIssue({
      code: 'custom',
      path: ['thresholds', index, 'value'],
      message: threshold.recurring ? POSITIVE_VALUE_ERROR : REQUIRED_ERROR,
    })
  })
}

export const buildContractAlertSchema = (
  takenScopeKeys: Set<string>,
): z.ZodType<ContractAlertFormValues, ContractAlertFormValues> =>
  z
    .object({
      name: z.string().trim().min(1, { message: MANDATORY_ERROR }),
      code: z.string().trim().min(1, { message: MANDATORY_ERROR }),
      alertType: z
        .union([z.enum(ContractAlertTypeEnum), z.literal('')])
        .optional()
        .refine((value) => !!value, { message: REQUIRED_ERROR }),
      scope: scopeSchema.nullable(),
      thresholds: z.array(thresholdSchema).superRefine(refineThresholdsNotifyOn),
    })
    .superRefine(({ alertType, scope, thresholds }, ctx) => {
      refineThresholdValues(thresholds, ctx)

      if (!alertType) return

      if (!scope) {
        const isScopeRequired =
          alertType === ContractAlertTypeEnum.UsageUnits || isWholeContractTaken(takenScopeKeys)

        if (isScopeRequired) {
          ctx.addIssue({ code: 'custom', path: ['scope'], message: MANDATORY_ERROR })
        }

        return
      }

      if (!scope.type || !scope.productCode) {
        ctx.addIssue({ code: 'custom', path: ['scope'], message: MANDATORY_ERROR })

        return
      }

      if (scope.isFilterAdded && !scope.productFilterCode) {
        ctx.addIssue({
          code: 'custom',
          path: ['scope', 'productFilterCode'],
          message: MANDATORY_ERROR,
        })

        return
      }

      const scopeKey = toScopeKey({
        alertType,
        productCode: scope.productCode,
        productFilterCode: scope.productFilterCode,
        withProductFilters: !scope.productFilterCode && scope.withProductFilters,
      })

      if (takenScopeKeys.has(scopeKey)) {
        ctx.addIssue({
          code: 'custom',
          path: ['scope', 'productCode'],
          message: SCOPE_ALREADY_TAKEN_ERROR,
        })
      }
    })
