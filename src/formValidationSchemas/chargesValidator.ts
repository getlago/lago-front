import { object, string, array, number } from 'yup'

import { ChargeModelEnum } from '~/generated/graphql'

export const chargesValidationSchema = array().of(
  object().shape({
    chargeModel: string().required(''),
    amount: number().when('chargeModel', {
      is: (chargeModel: ChargeModelEnum) =>
        !!chargeModel && [ChargeModelEnum.Standard, ChargeModelEnum.Package].includes(chargeModel),
      then: number().typeError('text_624ea7c29103fd010732ab7d').required(''),
    }),
    packageSize: number().when('chargeModel', {
      is: (chargeModel: ChargeModelEnum) =>
        !!chargeModel && ChargeModelEnum.Package === chargeModel,
      then: number()
        .min(1, 'text_6282085b4f283b0102655888')
        .required('text_6282085b4f283b0102655888'),
    }),
    rate: number().when('chargeModel', {
      is: (chargeModel: ChargeModelEnum) =>
        !!chargeModel && ChargeModelEnum.Percentage === chargeModel,
      then: number().min(0.001, 'text_62a0b7107afa2700a65ef70e').required(''),
    }),
    fixedAmount: number().when('chargeModel', {
      is: (chargeModel: ChargeModelEnum) =>
        !!chargeModel && ChargeModelEnum.Percentage === chargeModel,
      then: number().min(0.001, 'text_62a0b7107afa2700a65ef70e'),
    }),
    freeUnitsPerEvents: number().when('chargeModel', {
      is: (chargeModel: ChargeModelEnum) =>
        !!chargeModel && ChargeModelEnum.Percentage === chargeModel,
      then: number(),
    }),
    freeUnitsPerTotalAggregation: number().when('chargeModel', {
      is: (chargeModel: ChargeModelEnum) =>
        !!chargeModel && ChargeModelEnum.Percentage === chargeModel,
      then: number(),
    }),
    graduatedRanges: array()
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Graduated,
        then: array()
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
      .nullable(),
    volumeRanges: array()
      .when('chargeModel', {
        is: (chargeModel: ChargeModelEnum) =>
          !!chargeModel && chargeModel === ChargeModelEnum.Volume,
        then: array()
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
      .nullable(),
  })
)
