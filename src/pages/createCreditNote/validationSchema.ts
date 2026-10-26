import { z } from 'zod'

import {
  CreditNoteFeeErrorEnum,
  CreditNoteForm,
  FeesPerInvoice,
  FromFee,
  PayBackErrorEnum,
} from '~/components/creditNote/types'
import { getPayBackFields } from '~/components/creditNote/utils'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import { zodMetadataSchema } from '~/formValidation/metadataSchema'
import { CreditNoteReasonEnum, CurrencyEnum } from '~/generated/graphql'

export const CREDIT_NOTE_METADATA_KEY_MAX_LENGTH = 40
export const CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH = 255
export const MAX_CREDIT_NOTE_METADATA_COUNT = 50

// Not a form field: the allocation sum error has no input of its own, so it is raised on
// this path and read back from the form error map by `CreditNoteFormAllocation`.
export const PAY_BACK_ERRORS_PATH = 'payBackErrors'

// Smallest amount the yup schema accepted on a checked fee; kept so an empty or zero
// input still reports `minZero` rather than passing.
const MIN_CHECKED_FEE_VALUE = 0.0000000000000001

export type CreditNoteFormValues = {
  reason: CreditNoteReasonEnum | undefined
  description?: string
  fees?: FeesPerInvoice
  addOnFee?: FromFee[]
  creditFee?: FromFee[]
  payBack: CreditNoteForm['payBack']
  metadata: Array<{ key: string; value: string }>
}

export type AllocationLimits = {
  totalTaxIncluded: number
  maxCreditableAmount: number
  maxRefundableAmount: number
  maxOffsettableAmount: number
}

export const CREDIT_NOTE_DEFAULT_VALUES: CreditNoteFormValues = {
  reason: undefined,
  description: undefined,
  fees: undefined,
  addOnFee: undefined,
  creditFee: undefined,
  payBack: [],
  metadata: [],
}

const toAmount = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0

  const parsed = Number(value)

  return Number.isNaN(parsed) ? 0 : parsed
}

const addFeeIssues = (
  row: FromFee | undefined,
  maxAmount: number,
  ctx: z.RefinementCtx,
  path: PropertyKey[],
): void => {
  if (!row?.checked) return

  const value = toAmount(row.value)

  if (value < MIN_CHECKED_FEE_VALUE) {
    ctx.addIssue({ code: 'custom', message: CreditNoteFeeErrorEnum.minZero, path })

    return
  }

  if (value > maxAmount) {
    ctx.addIssue({ code: 'custom', message: CreditNoteFeeErrorEnum.overMax, path })
  }
}

// `addOnFee` and `creditFee` are positional: the row at index i is validated against the
// invoice fee at index i, the way the yup `tuple()` schemas did.
const indexedFeesSchema = (initialFees: FromFee[] | undefined, currency: CurrencyEnum) =>
  z
    .custom<FromFee[]>()
    .optional()
    .superRefine((rows, ctx) => {
      if (!Array.isArray(rows)) return

      rows.forEach((row, index) => {
        const maxAmount = deserializeAmount(initialFees?.[index]?.maxAmount || 0, currency)

        addFeeIssues(row, maxAmount, ctx, [index, 'value'])
      })
    })

// Subscription fees are matched by id, not by position: the displayed list interleaves
// true-up fees with their parent while the invoice list keeps its own order.
const subscriptionFeesSchema = (
  feesPerInvoice: FeesPerInvoice | undefined,
  currency: CurrencyEnum,
) =>
  z
    .custom<FeesPerInvoice>()
    .optional()
    .superRefine((fees, ctx) => {
      if (!fees) return

      Object.keys(fees).forEach((subKey) => {
        const initialFees = feesPerInvoice?.[subKey]?.fees || []

        ;(fees[subKey]?.fees || []).forEach((row, index) => {
          const initialFee = initialFees.find((fee) => fee.id === row?.id)
          const maxAmount = deserializeAmount(initialFee?.maxAmount || 0, currency)

          addFeeIssues(row, maxAmount, ctx, [subKey, 'fees', index, 'value'])
        })
      })
    })

const forwardIssues = (
  result: z.ZodSafeParseResult<unknown>,
  ctx: z.RefinementCtx,
  prefix: PropertyKey[],
): void => {
  if (result.success) return

  result.error.issues.forEach((issue) => {
    ctx.addIssue({ code: 'custom', message: issue.message, path: [...prefix, ...issue.path] })
  })
}

type HasCreditNoteFeeErrorsParams = {
  currency: CurrencyEnum
  feesPerInvoice: FeesPerInvoice | undefined
  feeForAddOn: FromFee[] | undefined
  fees: FeesPerInvoice | undefined
  addOnFee: FromFee[] | undefined
}

// The estimate is skipped while a fee is out of bounds. Submit-first validation only
// fills the form error map once a submit has been attempted, so this runs the fee rules
// directly instead of reading that map.
export const hasCreditNoteFeeErrors = ({
  currency,
  feesPerInvoice,
  feeForAddOn,
  fees,
  addOnFee,
}: HasCreditNoteFeeErrorsParams): boolean => {
  const feesInvalid = !subscriptionFeesSchema(feesPerInvoice, currency).safeParse(fees).success
  const addOnInvalid = !indexedFeesSchema(feeForAddOn, currency).safeParse(addOnFee).success

  return feesInvalid || addOnInvalid
}

type BuildCreditNoteSchemaParams = {
  currency: CurrencyEnum
  feesPerInvoice: FeesPerInvoice | undefined
  feeForAddOn: FromFee[] | undefined
  feeForCredit: FromFee[] | undefined
  isPrepaidCreditsInvoice: boolean
  // Read at validation time, not at build time: the estimate lands after the schema is
  // built, and every re-estimate would otherwise need a new schema.
  getAllocationLimits: () => AllocationLimits
}

export const buildCreditNoteSchema = ({
  currency,
  feesPerInvoice,
  feeForAddOn,
  feeForCredit,
  isPrepaidCreditsInvoice,
  getAllocationLimits,
}: BuildCreditNoteSchemaParams) => {
  const currencyPrecision = getCurrencyPrecision(currency)

  const feesSchema = subscriptionFeesSchema(feesPerInvoice, currency)
  const addOnFeeSchema = indexedFeesSchema(feeForAddOn, currency)
  const creditFeeSchema = indexedFeesSchema(feeForCredit, currency)
  const metadataSchema = zodMetadataSchema(
    CREDIT_NOTE_METADATA_VALUE_MAX_LENGTH,
    CREDIT_NOTE_METADATA_KEY_MAX_LENGTH,
  )

  // Every rule is forwarded from one root refinement rather than declared per key: a
  // failing key on `z.object` skips the object-level check, which would hide the
  // allocation error as soon as a fee or the reason were invalid.
  return z.custom<CreditNoteFormValues>().superRefine((values, ctx) => {
    if (!values) return

    if (!values.reason) {
      ctx.addIssue({ code: 'custom', path: ['reason'] })
    }

    forwardIssues(feesSchema.safeParse(values.fees), ctx, ['fees'])
    forwardIssues(addOnFeeSchema.safeParse(values.addOnFee), ctx, ['addOnFee'])
    forwardIssues(creditFeeSchema.safeParse(values.creditFee), ctx, ['creditFee'])
    forwardIssues(metadataSchema.safeParse(values.metadata), ctx, ['metadata'])

    // Prepaid credits mirror the single credit fee into one payBack row; they never go
    // through the estimate, so there is nothing to allocate against.
    if (isPrepaidCreditsInvoice) return

    const { totalTaxIncluded, maxCreditableAmount, maxRefundableAmount, maxOffsettableAmount } =
      getAllocationLimits()

    const { credit, refund, offset } = getPayBackFields(values.payBack)

    const sum = credit.value + refund.value + offset.value

    if (
      Number(sum.toFixed(currencyPrecision)) !== Number(totalTaxIncluded.toFixed(currencyPrecision))
    ) {
      ctx.addIssue({
        code: 'custom',
        message: PayBackErrorEnum.maxTotalInvoice,
        path: [PAY_BACK_ERRORS_PATH],
      })
    }

    if (refund.show && refund.value > maxRefundableAmount) {
      ctx.addIssue({
        code: 'custom',
        message: PayBackErrorEnum.maxRefund,
        path: ['payBack', refund.index, 'value'],
      })
    }

    if (credit.show && credit.value > maxCreditableAmount) {
      ctx.addIssue({
        code: 'custom',
        message: PayBackErrorEnum.maxCredit,
        path: ['payBack', credit.index, 'value'],
      })
    }

    if (offset.show && offset.value > maxOffsettableAmount) {
      ctx.addIssue({
        code: 'custom',
        message: PayBackErrorEnum.maxOffset,
        path: ['payBack', offset.index, 'value'],
      })
    }
  })
}
