import { object, number, boolean } from 'yup'
import _get from 'lodash/get'

import {
  FeesPerInvoice,
  CreditNoteFeeErrorEnum,
  FromFee,
  GroupedFee,
} from '~/components/creditNote/types'

const simpleFeeSchema = (formikInitialFees: FeesPerInvoice, feeKey: string) =>
  object().shape({
    checked: boolean(),
    value: number().when('checked', (checked: boolean, schema) => {
      return !!checked
        ? number()
            .min(0.000001, CreditNoteFeeErrorEnum.minZero)
            .max(
              _get(formikInitialFees || {}, feeKey) as unknown as number,
              CreditNoteFeeErrorEnum.overMax
            )
            .required('')
        : schema
    }),
  })

export const generateFeesSchema = (formikInitialFees: FeesPerInvoice) =>
  object().shape(
    Object.keys(formikInitialFees || {}).reduce((accSub, subKey) => {
      const subChilds = formikInitialFees[subKey]?.fees

      accSub = {
        ...accSub,
        [subKey]: object().shape({
          fees: object().shape(
            Object.keys(subChilds).reduce((feeGroupAcc, feeGroupKey) => {
              const child = subChilds[feeGroupKey] as FromFee

              if (typeof child.checked === 'boolean') {
                return {
                  ...feeGroupAcc,
                  [feeGroupKey]: simpleFeeSchema(
                    formikInitialFees,
                    `${subKey}.fees.${feeGroupKey}.value`
                  ),
                }
              }
              const grouped = (child as unknown as GroupedFee)?.grouped

              return {
                ...feeGroupAcc,
                [feeGroupKey]: object().shape({
                  grouped: object().shape(
                    Object.keys(grouped).reduce((feeAcc, feeKey) => {
                      return {
                        ...feeAcc,
                        [feeKey]: simpleFeeSchema(
                          formikInitialFees,
                          `${subKey}.fees.${feeGroupKey}.grouped.${feeKey}.value`
                        ),
                      }
                    }, {})
                  ),
                }),
              }
            }, {})
          ),
        }),
      }
      return accSub
    }, {})
  )
