import { z } from 'zod'

import { ALL_FILTER_VALUES } from '~/core/constants/form'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { AdjustedFeeTypeEnum, CreateAdjustedFeeInput } from '~/generated/graphql'

const REQUIRED_FIELD_ERROR = 'text_1771342994699klxu2paz7g8'

export const editFeeValidationSchema = z
  .object({
    invoiceDisplayName: z.string(),
    chargeFilterId: z.string().optional(),
    chargeId: z.string(),
    fixedChargeId: z.string(),
    units: z.string(),
    unitPreciseAmount: z.string(),
    adjustmentType: z.enum(AdjustedFeeTypeEnum).optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.adjustmentType) {
      ctx.addIssue({
        code: 'custom',
        path: ['adjustmentType'],
        message: REQUIRED_FIELD_ERROR,
      })

      return
    }

    if (values.units === '') {
      ctx.addIssue({ code: 'custom', path: ['units'], message: REQUIRED_FIELD_ERROR })
    }

    if (
      values.adjustmentType === AdjustedFeeTypeEnum.AdjustedAmount &&
      values.unitPreciseAmount === ''
    ) {
      ctx.addIssue({ code: 'custom', path: ['unitPreciseAmount'], message: REQUIRED_FIELD_ERROR })
    }
  })

export type EditFeeFormValues = z.infer<typeof editFeeValidationSchema>

export const EDIT_FEE_DEFAULT_VALUES: EditFeeFormValues = {
  invoiceDisplayName: '',
  chargeFilterId: '',
  chargeId: '',
  fixedChargeId: '',
  units: '',
  unitPreciseAmount: '',
  adjustmentType: undefined,
}

export const buildEditFeeDefaultValues = ({
  fee,
  isRegenerateMode,
}: {
  fee: TExtendedRemainingFee | undefined
  isRegenerateMode: boolean
}): EditFeeFormValues => ({
  ...EDIT_FEE_DEFAULT_VALUES,
  invoiceDisplayName: fee?.invoiceDisplayName || '',
  units: isRegenerateMode ? (fee?.units?.toString() ?? '') : '',
  unitPreciseAmount: isRegenerateMode ? (fee?.preciseUnitAmount?.toString() ?? '') : '',
})

export const buildEditFeeInput = ({
  values,
  invoiceId,
  feeId,
}: {
  values: EditFeeFormValues
  invoiceId: string
  feeId: string | undefined
}): CreateAdjustedFeeInput => {
  const { adjustmentType, unitPreciseAmount, units } = values

  return {
    // An explicit null means "every filter"; undefined means none was picked.
    chargeFilterId:
      values.chargeFilterId === ALL_FILTER_VALUES ? null : values.chargeFilterId || undefined,
    chargeId: values.chargeId,
    feeId,
    fixedChargeId: values.fixedChargeId,
    invoiceDisplayName: values.invoiceDisplayName || undefined,
    invoiceId,
    unitPreciseAmount:
      adjustmentType === AdjustedFeeTypeEnum.AdjustedAmount ? String(unitPreciseAmount) : undefined,
    units: adjustmentType ? Number(units || 0) : undefined,
  }
}
