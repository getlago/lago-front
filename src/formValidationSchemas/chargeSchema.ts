import { object, string, number, array } from 'yup'

import { BillableMetric, ChargeModelEnum } from '~/generated/graphql'

const standardShape = object().shape({
  amount: number().typeError('text_624ea7c29103fd010732ab7d').required(''),
})

const packageShape = object().shape({
  amount: number().typeError('text_624ea7c29103fd010732ab7d').required(''),
  packageSize: number()
    .min(1, 'text_6282085b4f283b0102655888')
    .required('text_6282085b4f283b0102655888'),
})

const percentageShape = object().shape({
  rate: number().min(0.001, 'text_62a0b7107afa2700a65ef70e').required(''),
  fixedAmount: number().min(0.001, 'text_62a0b7107afa2700a65ef70e'),
  freeUnitsPerEvents: number(),
  freeUnitsPerTotalAggregation: number(),
})

const graduatedShape = object().shape({
  graduatedRanges: array()
    .test({
      test: (graduatedRange) => {
        let isValid = true

        graduatedRange?.every(({ fromValue, toValue, perUnitAmount, flatAmount }, i) => {
          if (isNaN(Number(perUnitAmount)) && isNaN(Number(flatAmount))) {
            isValid = false
            return false
          }

          if (
            i < graduatedRange.length - 1 &&
            (typeof fromValue !== 'number' || (fromValue || 0) > toValue)
          ) {
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
})

const volumeShape = object().shape({
  volumeRanges: array()
    .test({
      test: (volumeRange) => {
        let isValid = true

        volumeRange?.every(({ fromValue, toValue, perUnitAmount, flatAmount }, i) => {
          if (isNaN(Number(perUnitAmount)) && isNaN(Number(flatAmount))) {
            isValid = false
            return false
          }

          if (
            i < volumeRange.length - 1 &&
            (typeof fromValue !== 'number' || (fromValue || 0) > toValue)
          ) {
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
})

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
        then: standardShape,
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Package &&
          !!billableMetric &&
          !billableMetric.flatGroups?.length,
        then: packageShape,
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Percentage &&
          !!billableMetric &&
          !billableMetric.flatGroups?.length,
        then: percentageShape,
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Graduated &&
          !!billableMetric &&
          !billableMetric.flatGroups?.length,
        then: graduatedShape,
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Volume &&
          !!billableMetric &&
          !billableMetric.flatGroups?.length,
        then: volumeShape,
      }),
    groupProperties: array()
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Standard &&
          !!billableMetric &&
          !!billableMetric.flatGroups?.length,
        then: array().of(
          object().shape({
            values: standardShape,
          })
        ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Package &&
          !!billableMetric &&
          !!billableMetric.flatGroups?.length,
        then: array().of(
          object().shape({
            values: packageShape,
          })
        ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Percentage &&
          !!billableMetric &&
          !!billableMetric.flatGroups?.length,
        then: array().of(
          object().shape({
            values: percentageShape,
          })
        ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Graduated &&
          !!billableMetric &&
          !!billableMetric.flatGroups?.length,
        then: array().of(
          object().shape({
            values: graduatedShape,
          })
        ),
      })
      .when(['chargeModel', 'billableMetric'], {
        is: (chargeModel: ChargeModelEnum, billableMetric: BillableMetric) =>
          !!chargeModel &&
          chargeModel === ChargeModelEnum.Volume &&
          !!billableMetric &&
          !!billableMetric.flatGroups?.length,
        then: array().of(
          object().shape({
            values: volumeShape,
          })
        ),
      }),
  })
)
