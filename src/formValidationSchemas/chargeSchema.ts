import { object, string, number, array } from 'yup'

import { ChargeModelEnum } from '~/generated/graphql'

export const chargeSchema = array().of(
  object().shape({
    chargeModel: string().required(''),
    properties: object()
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Standard,
        then: object().shape({
          amount: number().typeError('text_624ea7c29103fd010732ab7d').required(''),
        }),
      })
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Package,
        then: object().shape({
          amount: number().typeError('text_624ea7c29103fd010732ab7d').required(''),
          packageSize: number()
            .min(1, 'text_6282085b4f283b0102655888')
            .required('text_6282085b4f283b0102655888'),
        }),
      })
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Percentage,
        then: object().shape({
          rate: number().min(0.001, 'text_62a0b7107afa2700a65ef70e').required(''),
          fixedAmount: number().min(0.001, 'text_62a0b7107afa2700a65ef70e'),
          freeUnitsPerEvents: number(),
          freeUnitsPerTotalAggregation: number(),
        }),
      })
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Graduated,
        then: object().shape({
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
        }),
      })
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Volume,
        then: object().shape({
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
        }),
      }),
  })
)
