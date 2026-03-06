import { z } from 'zod'

const graduatedRangeSchema = z.object({
  fromValue: z.string(),
  toValue: z.string().nullable(),
  perUnitAmount: z.string().optional(),
  flatAmount: z.string().optional(),
})

const graduatedPercentageRangeSchema = z.object({
  fromValue: z.string(),
  toValue: z.string().nullable(),
  rate: z.string().optional(),
  flatAmount: z.string().optional(),
})

const volumeRangeSchema = z.object({
  fromValue: z.string(),
  toValue: z.string().nullable(),
  perUnitAmount: z.string().optional(),
  flatAmount: z.string().optional(),
})

export const propertiesZodSchema = z.object({
  amount: z.string().optional().nullable(),
  rate: z.string().optional().nullable(),
  fixedAmount: z.string().optional().nullable(),
  freeUnits: z.string().optional().nullable(),
  freeUnitsPerEvents: z.string().optional().nullable(),
  freeUnitsPerTotalAggregation: z.string().optional().nullable(),
  packageSize: z.string().optional().nullable(),
  perTransactionMinAmount: z.string().optional().nullable(),
  perTransactionMaxAmount: z.string().optional().nullable(),
  pricingGroupKeys: z.array(z.string()).optional().nullable(),
  customProperties: z.unknown().optional().nullable(),
  graduatedRanges: z.array(graduatedRangeSchema).optional().nullable(),
  graduatedPercentageRanges: z.array(graduatedPercentageRangeSchema).optional().nullable(),
  volumeRanges: z.array(volumeRangeSchema).optional().nullable(),
})

export type PropertiesZodInput = z.infer<typeof propertiesZodSchema>

// Treats empty strings, undefined, null, and NaN as invalid amounts.
// This is needed because TanStack Form initializes undefined field values to ''
// and Number('') === 0 which passes isNaN checks.
function isInvalidAmount(val: string | undefined | null): boolean {
  return !val || isNaN(Number(val))
}

function isInvalidRate(val: string | undefined | null): boolean {
  return isNaN(Number(val)) || val === '' || val === null || val === undefined
}

// True if value is non-empty/non-undefined but not a valid number (e.g. 'a').
// Mirrors Yup's validateRangeAmounts second check.
function isNonEmptyNaN(val: string | undefined | null): boolean {
  return !!val && isNaN(Number(val))
}

// For last range, toValue can be empty/null/undefined (represents infinity).
// For all other ranges, fromValue must be strictly less than toValue.
function isInvalidFromTo(fromValue: string, toValue: string | null, isLastRange: boolean): boolean {
  if (isLastRange && (toValue === undefined || toValue === null || toValue === '')) {
    return false
  }

  return Number(fromValue || 0) >= Number(toValue || 0)
}

export function validateChargeProperties(
  chargeModel: string,
  props: PropertiesZodInput | undefined,
  ctx: z.RefinementCtx,
  pathPrefix: string[],
) {
  if (!props) return

  if (chargeModel === 'standard') {
    if (isInvalidAmount(props.amount)) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_624ea7c29103fd010732ab7d',
        path: [...pathPrefix, 'amount'],
      })
    }
  }

  if (chargeModel === 'package') {
    if (isInvalidAmount(props.amount)) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_624ea7c29103fd010732ab7d',
        path: [...pathPrefix, 'amount'],
      })
    }
    if (!props.packageSize || isNaN(Number(props.packageSize)) || Number(props.packageSize) < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_6282085b4f283b0102655888',
        path: [...pathPrefix, 'packageSize'],
      })
    }
  }

  if (chargeModel === 'percentage') {
    if (isInvalidRate(props.rate)) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_624ea7c29103fd010732ab7d',
        path: [...pathPrefix, 'rate'],
      })
    }

    if (
      props.perTransactionMinAmount &&
      props.perTransactionMaxAmount &&
      Number(props.perTransactionMinAmount) > Number(props.perTransactionMaxAmount)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'minAmountShouldBeLowerThanMax',
        path: [...pathPrefix, 'perTransactionMinAmount'],
      })
      ctx.addIssue({
        code: 'custom',
        message: 'maxAmountShouldBeHigherThanMin',
        path: [...pathPrefix, 'perTransactionMaxAmount'],
      })
    }
  }

  if (chargeModel === 'graduated') {
    const ranges = props.graduatedRanges

    if (!ranges?.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_624ea7c29103fd010732ab7d',
        path: [...pathPrefix, 'graduatedRanges'],
      })
      return
    }

    for (let i = 0; i < ranges.length; i++) {
      const { fromValue, toValue, perUnitAmount, flatAmount } = ranges[i]

      // Both empty/invalid → need at least one amount
      if (isInvalidAmount(perUnitAmount) && isInvalidAmount(flatAmount)) {
        ctx.addIssue({
          code: 'custom',
          message: 'text_624ea7c29103fd010732ab7d',
          path: [...pathPrefix, 'graduatedRanges', i, 'perUnitAmount'],
        })
        ctx.addIssue({
          code: 'custom',
          message: 'text_624ea7c29103fd010732ab7d',
          path: [...pathPrefix, 'graduatedRanges', i, 'flatAmount'],
        })
      } else {
        // Individual non-empty NaN → that specific field is wrong
        if (isNonEmptyNaN(perUnitAmount)) {
          ctx.addIssue({
            code: 'custom',
            message: 'text_624ea7c29103fd010732ab7d',
            path: [...pathPrefix, 'graduatedRanges', i, 'perUnitAmount'],
          })
        }
        if (isNonEmptyNaN(flatAmount)) {
          ctx.addIssue({
            code: 'custom',
            message: 'text_624ea7c29103fd010732ab7d',
            path: [...pathPrefix, 'graduatedRanges', i, 'flatAmount'],
          })
        }
      }

      const isLastRange = i === ranges.length - 1

      if (isInvalidFromTo(fromValue, toValue, isLastRange)) {
        ctx.addIssue({
          code: 'custom',
          message: 'text_624ea7c29103fd010732ab7d',
          path: [...pathPrefix, 'graduatedRanges', i, 'toValue'],
        })
      }
    }
  }

  if (chargeModel === 'graduated_percentage') {
    const ranges = props.graduatedPercentageRanges

    if (!ranges?.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_624ea7c29103fd010732ab7d',
        path: [...pathPrefix, 'graduatedPercentageRanges'],
      })
      return
    }

    for (let i = 0; i < ranges.length; i++) {
      const { fromValue, toValue, rate } = ranges[i]

      if (isInvalidRate(rate)) {
        ctx.addIssue({
          code: 'custom',
          message: 'text_624ea7c29103fd010732ab7d',
          path: [...pathPrefix, 'graduatedPercentageRanges', i, 'rate'],
        })
      }

      const isLastRange = i === ranges.length - 1

      if (isInvalidFromTo(fromValue, toValue, isLastRange)) {
        ctx.addIssue({
          code: 'custom',
          message: 'text_624ea7c29103fd010732ab7d',
          path: [...pathPrefix, 'graduatedPercentageRanges', i, 'toValue'],
        })
      }
    }
  }

  if (chargeModel === 'volume') {
    const ranges = props.volumeRanges

    if (!ranges?.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_624ea7c29103fd010732ab7d',
        path: [...pathPrefix, 'volumeRanges'],
      })
      return
    }

    for (let i = 0; i < ranges.length; i++) {
      const { fromValue, toValue, perUnitAmount, flatAmount } = ranges[i]

      // Both empty/invalid → need at least one amount
      if (isInvalidAmount(perUnitAmount) && isInvalidAmount(flatAmount)) {
        ctx.addIssue({
          code: 'custom',
          message: 'text_624ea7c29103fd010732ab7d',
          path: [...pathPrefix, 'volumeRanges', i, 'perUnitAmount'],
        })
        ctx.addIssue({
          code: 'custom',
          message: 'text_624ea7c29103fd010732ab7d',
          path: [...pathPrefix, 'volumeRanges', i, 'flatAmount'],
        })
      } else {
        // Individual non-empty NaN → that specific field is wrong
        if (isNonEmptyNaN(perUnitAmount)) {
          ctx.addIssue({
            code: 'custom',
            message: 'text_624ea7c29103fd010732ab7d',
            path: [...pathPrefix, 'volumeRanges', i, 'perUnitAmount'],
          })
        }
        if (isNonEmptyNaN(flatAmount)) {
          ctx.addIssue({
            code: 'custom',
            message: 'text_624ea7c29103fd010732ab7d',
            path: [...pathPrefix, 'volumeRanges', i, 'flatAmount'],
          })
        }
      }

      const isLastRange = i === ranges.length - 1

      if (isInvalidFromTo(fromValue, toValue, isLastRange)) {
        ctx.addIssue({
          code: 'custom',
          message: 'text_624ea7c29103fd010732ab7d',
          path: [...pathPrefix, 'volumeRanges', i, 'toValue'],
        })
      }
    }
  }

  if (chargeModel === 'custom') {
    if (!props.customProperties) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_624ea7c29103fd010732ab7d',
        path: [...pathPrefix, 'customProperties'],
      })
    } else {
      try {
        const parsed =
          typeof props.customProperties === 'string'
            ? JSON.parse(props.customProperties)
            : props.customProperties

        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error()
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'text_624ea7c29103fd010732ab7d',
          path: [...pathPrefix, 'customProperties'],
        })
      }
    }
  }
}
