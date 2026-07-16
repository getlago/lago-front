import { z } from 'zod'

import { InvoiceFormInput } from '~/components/invoices/types'

/**
 * 1:1 parity port of the Yup schema from CreateInvoice.tsx — do NOT tighten
 * rules here. In particular `fees: []` is VALID (the "at least one fee" block
 * lives in the submit-button gate), and only the three checked fields have
 * rules: everything else is deliberately unvalidated.
 */

// `required` ports Yup's message-less required('') — Zod v4 renders an empty
// message as "Invalid input". `feeUnitsBelowOne` is the only error the UI
// displays (fee-row tooltip). Exported so tests/UI don't hardcode keys.
export const invoiceFormErrorLabels = {
  required: 'text_1771342994699klxu2paz7g8',
  feeUnitsBelowOne: 'text_645381a65b99559adf6401f0',
} as const

const REQUIRED_LABEL = invoiceFormErrorLabels.required

// Formik validated prepareDataForValidation(values), which converts '' to
// undefined — so '' must count as absent wherever presence is checked.
const prepared = <T>(value: T): T | undefined =>
  value === ('' as unknown as T) ? undefined : value

const isMissing = (value: unknown): boolean => {
  const preparedValue = prepared(value)

  return preparedValue === undefined || preparedValue === null
}

export const invoiceFormValidationSchema = z.custom<InvoiceFormInput>().superRefine((data, ctx) => {
  // superRefine must NEVER throw: an exception inside the validation phase
  // leaves the form stuck in isSubmitting forever.
  if (!data || typeof data !== 'object') {
    ctx.addIssue({ code: 'custom', message: REQUIRED_LABEL, path: [] })
    return
  }

  if (isMissing(data.customerId)) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_LABEL, path: ['customerId'] })
  }

  if (isMissing(data.currency)) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_LABEL, path: ['currency'] })
  }

  if (!Array.isArray(data.fees)) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_LABEL, path: ['fees'] })
    return
  }

  data.fees.forEach((fee, index) => {
    if (!fee || typeof fee !== 'object') {
      ctx.addIssue({ code: 'custom', message: REQUIRED_LABEL, path: ['fees', index] })
      return
    }

    if (isMissing(fee.addOnId)) {
      ctx.addIssue({ code: 'custom', message: REQUIRED_LABEL, path: ['fees', index, 'addOnId'] })
    }

    const preparedUnits = prepared(fee.units)

    if (preparedUnits === undefined || preparedUnits === null) {
      ctx.addIssue({ code: 'custom', message: REQUIRED_LABEL, path: ['fees', index, 'units'] })
    } else if (!(Number(preparedUnits) >= 1)) {
      ctx.addIssue({
        code: 'custom',
        message: invoiceFormErrorLabels.feeUnitsBelowOne,
        path: ['fees', index, 'units'],
      })
    }
  })
})
