import { DateTime } from 'luxon'
import { array, object, string } from 'yup'

import { dateErrorCodes, FORM_TYPE_ENUM } from '~/core/constants/form'
import {
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'

export const walletFormSchema = (formType: keyof typeof FORM_TYPE_ENUM) => {
  return object().shape({
    name: string(),
    expirationAt: string()
      .test({
        test: function (value, { path }) {
          // Value can be undefined
          if (!value) {
            return true
          }

          // Make sure value has correct format
          if (!DateTime.fromISO(value).isValid) {
            return this.createError({
              path,
              message: dateErrorCodes.wrongFormat,
            })
          }

          const endingAt = DateTime.fromISO(value)

          // Make sure endingAt is in the future
          if (DateTime.now().diff(endingAt, 'days').days >= 0) {
            return this.createError({
              path,
              message: dateErrorCodes.shouldBeInFuture,
            })
          }

          return true
        },
      })
      .nullable(),
    paidCredits: string().test({
      test: function (paidCredits) {
        if (formType === FORM_TYPE_ENUM.edition) return true

        const { grantedCredits } = this?.parent

        return !isNaN(Number(paidCredits)) || !isNaN(Number(grantedCredits))
      },
    }),
    grantedCredits: string().test({
      test: function (grantedCredits) {
        if (formType === FORM_TYPE_ENUM.edition) return true

        const { paidCredits } = this?.parent

        return !isNaN(Number(grantedCredits)) || !isNaN(Number(paidCredits))
      },
    }),
    rateAmount: string().required(''),

    recurringTransactionRules: array()
      .of(
        object().shape({
          trigger: string().required(''),
          method: string().required(''),
          interval: string()
            .test({
              test: function (interval) {
                const { trigger } = this?.parent

                if (!!trigger && trigger !== RecurringTransactionTriggerEnum.Interval) {
                  return true
                }

                return !!interval
              },
            })
            .nullable(),
          thresholdCredits: string()
            .test({
              test: function (thresholdCredits) {
                const { trigger } = this?.parent

                if (!!trigger && trigger !== RecurringTransactionTriggerEnum.Threshold) {
                  return true
                }

                return !!thresholdCredits
              },
            })
            .nullable(),
          paidCredits: string().test({
            test: function (paidCredits) {
              const { grantedCredits: ruleGrantedCredit, method } = this?.parent

              if (!!method && method !== RecurringTransactionMethodEnum.Fixed) {
                return true
              }

              return !isNaN(Number(paidCredits)) || !isNaN(Number(ruleGrantedCredit))
            },
          }),
          grantedCredits: string().test({
            test: function (grantedCredits) {
              const { paidCredits: rulePaidCredit, method } = this?.parent

              if (!!method && method !== RecurringTransactionMethodEnum.Fixed) {
                return true
              }

              return !isNaN(Number(grantedCredits)) || !isNaN(Number(rulePaidCredit))
            },
          }),
          targetOngoingBalance: string().test({
            test: function (targetOngoingBalance) {
              const { method } = this?.parent

              if (!!method && method !== RecurringTransactionMethodEnum.Target) {
                return true
              }

              return !!targetOngoingBalance
            },
          }),
        }),
      )
      .nullable(),
  })
}
