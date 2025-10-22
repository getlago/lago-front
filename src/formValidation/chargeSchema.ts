import { array, number, object, string } from 'yup'

import { LocalChargeFilterInput, LocalPricingUnitType } from '~/components/plans/types'
import { MIN_AMOUNT_SHOULD_BE_LOWER_THAN_MAX_ERROR } from '~/core/constants/form'
import { BillableMetric, ChargeModelEnum, Properties } from '~/generated/graphql'

const standardShape = {
  amount: number().typeError('text_624ea7c29103fd010732ab7d').required(''),
}

const packageShape = {
  amount: number().typeError('text_624ea7c29103fd010732ab7d').required(''),
  packageSize: number()
    .min(1, 'text_6282085b4f283b0102655888')
    .required('text_6282085b4f283b0102655888'),
}

const percentageShape = {
  rate: number().required(''),
  fixedAmount: number(),
  freeUnitsPerEvents: number(),
  freeUnitsPerTotalAggregation: number(),
  perTransactionMinAmount: number().test(
    MIN_AMOUNT_SHOULD_BE_LOWER_THAN_MAX_ERROR,
    MIN_AMOUNT_SHOULD_BE_LOWER_THAN_MAX_ERROR,
    (value, ctx) =>
      !value || !ctx.parent.perTransactionMaxAmount || value <= ctx.parent.perTransactionMaxAmount,
  ),
  perTransactionMaxAmount: number(),
}

const graduatedShape = {
  graduatedRanges: array()
    .test({
      test: (graduatedRanges) => {
        let isValid = true

        graduatedRanges?.every(({ fromValue, toValue, perUnitAmount, flatAmount }, i) => {
          // Check if both perUnitAmount and flatAmount are invalid
          if (isNaN(Number(perUnitAmount)) && isNaN(Number(flatAmount))) {
            isValid = false
            return false
          }

          // Check if either perUnitAmount or flatAmount is invalid (but not empty/undefined)
          if (
            (perUnitAmount !== undefined && perUnitAmount !== '' && isNaN(Number(perUnitAmount))) ||
            (flatAmount !== undefined && flatAmount !== '' && isNaN(Number(flatAmount)))
          ) {
            isValid = false
            return false
          }

          // Check for all ranges except the last one (which can have no toValue)
          if (i < graduatedRanges.length - 1) {
            if (Number(fromValue || 0) >= Number(toValue || 0)) {
              isValid = false
              return false
            }
          } else {
            // For the last range, check if toValue exists and validate
            if (toValue !== undefined && toValue !== null && toValue !== '') {
              if (Number(fromValue || 0) >= Number(toValue || 0)) {
                isValid = false
                return false
              }
            }
          }

          return true
        })

        return isValid
      },
    })
    .min(1)
    .required(''),
}

const graduatedPercentageShape = {
  graduatedPercentageRanges: array()
    .test({
      test: (graduatedPercentageRanges) => {
        let isValid = true

        graduatedPercentageRanges?.every(({ fromValue, toValue, rate }, i) => {
          // Check if rate is invalid
          if (isNaN(Number(rate)) || rate === '' || rate === null) {
            isValid = false
            return false
          }

          // Check for all ranges except the last one (which can have no toValue)
          if (i < graduatedPercentageRanges.length - 1) {
            if (Number(fromValue || 0) >= Number(toValue || 0)) {
              isValid = false
              return false
            }
          } else {
            // For the last range, check if toValue exists and validate
            if (toValue !== undefined && toValue !== null && toValue !== '') {
              if (Number(fromValue || 0) >= Number(toValue || 0)) {
                isValid = false
                return false
              }
            }
          }

          return true
        })

        return isValid
      },
    })
    .min(1)
    .required(''),
}

const volumeShape = {
  volumeRanges: array()
    .test({
      test: (volumeRanges) => {
        let isValid = true

        volumeRanges?.every(({ fromValue, toValue, perUnitAmount, flatAmount }, i) => {
          // Check if both perUnitAmount and flatAmount are invalid
          if (isNaN(Number(perUnitAmount)) && isNaN(Number(flatAmount))) {
            isValid = false
            return false
          }

          // Check if either perUnitAmount or flatAmount is invalid (but not empty/undefined)
          if (
            (perUnitAmount !== undefined && perUnitAmount !== '' && isNaN(Number(perUnitAmount))) ||
            (flatAmount !== undefined && flatAmount !== '' && isNaN(Number(flatAmount)))
          ) {
            isValid = false
            return false
          }

          // Check for all ranges except the last one (which can have no toValue)
          if (i < volumeRanges.length - 1) {
            if (Number(fromValue || 0) >= Number(toValue || 0)) {
              isValid = false
              return false
            }
          } else {
            // For the last range, check if toValue exists and validate
            if (toValue !== undefined && toValue !== null && toValue !== '') {
              if (Number(fromValue || 0) >= Number(toValue || 0)) {
                isValid = false
                return false
              }
            }
          }

          return true
        })

        return isValid
      },
    })
    .min(1)
    .required(''),
}

export const customShape = {
  customProperties: object().json().required(''),
}

export const chargeSchema = array().of(
  object().shape({
    chargeModel: string().required(''),
    appliedPricingUnit: object()
      .shape({
        type: string().required(''),
        code: string().required(''),
        shortName: string().required(''),
        conversionRate: string().when('type', {
          is: LocalPricingUnitType.Custom,
          then: (schema) =>
            schema.required('').test('conversionRate', '', (value) => Number(value || 0) > 0),
          otherwise: (schema) => schema.optional(),
        }),
      })
      .default(undefined)
      .nullable()
      .notRequired(),
    properties: object()
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Standard,
        then: () =>
          object().when({
            is: (values: Properties) => !!values,
            then: (schema) => schema.shape(standardShape),
          }),
      })
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Package,
        then: () =>
          object().when({
            is: (values: Properties) => !!values,
            then: (schema) => schema.shape(packageShape),
          }),
      })
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Percentage,
        then: () =>
          object().when({
            is: (values: Properties) => !!values,
            then: (schema) => schema.shape(percentageShape),
          }),
      })
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Graduated,
        then: () =>
          object().when({
            is: (values: Properties) => !!values,
            then: (schema) => schema.shape(graduatedShape),
          }),
      })
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.GraduatedPercentage,
        then: () =>
          object().when({
            is: (values: Properties) => !!values,
            then: (schema) => schema.shape(graduatedPercentageShape),
          }),
      })
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Volume,
        then: () =>
          object().when({
            is: (values: Properties) => !!values,
            then: (schema) => schema.shape(volumeShape),
          }),
      })
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Custom,
        then: (schema) => schema.shape(customShape),
      })
      .when(['filters'], {
        is: (filter: LocalChargeFilterInput[]) => !filter?.length,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
      }),
    filters: array()
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Standard &&
          !!billableMetric &&
          !!billableMetric.filters?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              invoiceDisplayName: string().nullable(),
              properties: object().shape(standardShape),
              values: array().min(1).required(''),
            }),
          ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Package &&
          !!billableMetric &&
          !!billableMetric.filters?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              invoiceDisplayName: string().nullable(),
              properties: object().shape(packageShape),
              values: array().min(1).required(''),
            }),
          ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Percentage &&
          !!billableMetric &&
          !!billableMetric.filters?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              invoiceDisplayName: string().nullable(),
              properties: object().shape(percentageShape),
              values: array().min(1).required(''),
            }),
          ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Graduated &&
          !!billableMetric &&
          !!billableMetric.filters?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              invoiceDisplayName: string().nullable(),
              properties: object().shape(graduatedShape),
              values: array().min(1).required(''),
            }),
          ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.GraduatedPercentage &&
          !!billableMetric &&
          !!billableMetric.filters?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              invoiceDisplayName: string().nullable(),
              properties: object().shape(graduatedPercentageShape),
              values: array().min(1).required(''),
            }),
          ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Volume &&
          !!billableMetric &&
          !!billableMetric.filters?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              invoiceDisplayName: string().nullable(),
              properties: object().shape(volumeShape),
              values: array().min(1).required(''),
            }),
          ),
      }),
  }),
)
