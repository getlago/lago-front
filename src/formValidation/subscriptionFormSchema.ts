import { DateTime } from 'luxon'
import { z } from 'zod'

import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { BillingTimeEnum } from '~/generated/graphql'

export interface SubscriptionFormValues {
  planId: string
  name: string
  externalId: string
  subscriptionAt: string
  endingAt?: string
  billingTime: BillingTimeEnum
  paymentMethod?: SelectedPaymentMethod
  invoiceCustomSection?: InvoiceCustomSectionInput
}

export const subscriptionFormSchema = z
  .custom<SubscriptionFormValues>()
  .superRefine((data, ctx) => {
    if (!data.planId) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_624ea7c29103fd010732ab7d',
        path: ['planId'],
      })
    }

    if (!data.subscriptionAt) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_624ea7c29103fd010732ab7d',
        path: ['subscriptionAt'],
      })
    }

    if (!data.endingAt) return

    if (!DateTime.fromISO(data.endingAt).isValid) {
      ctx.addIssue({
        code: 'custom',
        message: 'text_64ef55a730b88e3d2117b3d4',
        path: ['endingAt'],
      })
      return
    }

    if (data.subscriptionAt) {
      const subscriptionAt = DateTime.fromISO(data.subscriptionAt)
      const endingAt = DateTime.fromISO(data.endingAt)

      if (endingAt <= subscriptionAt || DateTime.now().diff(endingAt, 'days').days >= 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'text_64ef55a730b88e3d2117b3d4',
          path: ['endingAt'],
        })
      }
    }
  })
