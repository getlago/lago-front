import { object, string, number, array } from 'yup'

import { BillableMetric, ChargeModelEnum } from '~/generated/graphql'

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
}

const graduatedShape = {
  graduatedRanges: array()
    .test({
      test: (graduatedRange) => {
        let isValid = true

        graduatedRange?.every(({ fromValue, toValue, perUnitAmount, flatAmount }, i) => {
          if (isNaN(Number(perUnitAmount)) && isNaN(Number(flatAmount))) {
            isValid = false
            return false
          }

          if (i < graduatedRange.length - 1 && Number(fromValue || 0) > Number(toValue || 0)) {
            isValid = false
            return false
          }

          return true
        })

        return isValid
      },
    })
    .min(2)
    .required(''),
}

const volumeShape = {
  volumeRanges: array()
    .test({
      test: (volumeRange) => {
        let isValid = true

        volumeRange?.every(({ fromValue, toValue, perUnitAmount, flatAmount }, i) => {
          if (isNaN(Number(perUnitAmount)) && isNaN(Number(flatAmount))) {
            isValid = false
            return false
          }

          if (i < volumeRange.length - 1 && Number(fromValue || 0) > Number(toValue || 0)) {
            isValid = false
            return false
          }

          return true
        })

        return isValid
      },
    })
    .min(2)
    .required(''),
}

export const chargeSchema = array().of(
  object().shape({
    chargeModel: string().required(''),
    properties: object()
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Standard &&
          !!billableMetric &&
          !billableMetric.flatGroups?.length,
        then: (schema) => schema.shape(standardShape),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Package &&
          !!billableMetric &&
          !billableMetric.flatGroups?.length,
        then: (schema) => schema.shape(packageShape),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Percentage &&
          !!billableMetric &&
          !billableMetric.flatGroups?.length,
        then: (schema) => schema.shape(percentageShape),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Graduated &&
          !!billableMetric &&
          !billableMetric.flatGroups?.length,
        then: (schema) => schema.shape(graduatedShape),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Volume &&
          !!billableMetric &&
          !billableMetric.flatGroups?.length,
        then: (schema) => schema.shape(volumeShape),
      }),
    groupProperties: array()
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Standard &&
          !!billableMetric &&
          !!billableMetric.flatGroups?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              values: object().shape(standardShape),
            })
          ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Package &&
          !!billableMetric &&
          !!billableMetric.flatGroups?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              values: object().shape(packageShape),
            })
          ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Percentage &&
          !!billableMetric &&
          !!billableMetric.flatGroups?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              values: object().shape(percentageShape),
            })
          ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Graduated &&
          !!billableMetric &&
          !!billableMetric.flatGroups?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              values: object().shape(graduatedShape),
            })
          ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Volume &&
          !!billableMetric &&
          !!billableMetric.flatGroups?.length,
        then: (schema) =>
          schema.of(
            object().shape({
              values: object().shape(volumeShape),
            })
          ),
      }),
  })
)
