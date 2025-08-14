import { generatePath } from 'react-router-dom'

import { AvailableFiltersEnum, setFilterValue } from '~/components/designSystem/Filters'
import { ACTIVITY_LOG_ROUTE } from '~/components/developers/DevtoolsRouter'
import { ACTIVITY_LOG_FILTER_PREFIX } from '~/core/constants/filters'
import {
  BillableMetricDetailsTabsOptionsEnum,
  CouponDetailsTabsOptionsEnum,
  CustomerDetailsTabsOptions,
  CustomerInvoiceDetailsTabsOptionsEnum,
  FeatureDetailsTabsOptionsEnum,
  PlanDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  BILLABLE_METRIC_DETAILS_ROUTE,
  BILLING_ENTITY_ROUTE,
  COUPON_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  FEATURE_DETAILS_ROUTE,
  PLAN_DETAILS_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  ActivityLogDetailsFragment,
  ActivityTypeEnum,
  BillingEntity,
  CreditNote,
  CurrencyEnum,
  Invoice,
  ResourceTypeEnum,
  Wallet,
} from '~/generated/graphql'

// This function is used to check if all activity types are handled
const exhaustiveCheck = (value: never): never => {
  try {
    throw new Error(`Unhandled activity type: ${value}`)
  } catch {
    // Do nothing to avoid breaking on runtime
  }

  return value
}

const activityTypeTranslations: Record<ActivityTypeEnum, string> = {
  [ActivityTypeEnum.AppliedCouponCreated]: 'text_1747404806714mt6os3k8404',
  [ActivityTypeEnum.AppliedCouponDeleted]: 'text_1747404902717ou47ei2bfd3',
  [ActivityTypeEnum.BillableMetricCreated]: 'text_17474046566318icwya96cm4',
  [ActivityTypeEnum.BillableMetricDeleted]: 'text_17474046566319c9b81v2r5b',
  [ActivityTypeEnum.BillableMetricUpdated]: 'text_17474046566311zhsu2i0thx',
  [ActivityTypeEnum.BillingEntitiesCreated]: 'text_1747404806714wz80iiebunk',
  [ActivityTypeEnum.BillingEntitiesDeleted]: 'text_1747404806714fiv08w2gvok',
  [ActivityTypeEnum.BillingEntitiesUpdated]: 'text_1747404806714s6gku7iz6n0',
  [ActivityTypeEnum.CouponCreated]: 'text_1747404806714yvdfvc0bveg',
  [ActivityTypeEnum.CouponDeleted]: 'text_1747404806714vk3273sh3d1',
  [ActivityTypeEnum.CouponUpdated]: 'text_1747404806714pksbcbh2a0l',
  [ActivityTypeEnum.CreditNoteCreated]: 'text_1747404806714iqx0zaabim9',
  [ActivityTypeEnum.CreditNoteGenerated]: 'text_1747404806714x3lucaeii8l',
  [ActivityTypeEnum.CreditNoteRefundFailure]: 'text_1747404806714jb0pjc1kh7r',
  [ActivityTypeEnum.CustomerCreated]: 'text_1747404656632oqee107ov8u',
  [ActivityTypeEnum.CustomerDeleted]: 'text_1747404656632qp9qrpp0k7g',
  [ActivityTypeEnum.CustomerUpdated]: 'text_1747404656632j5yxb9h6lsu',
  [ActivityTypeEnum.FeatureCreated]: 'text_1754570508183f0dl9q0pqtx',
  [ActivityTypeEnum.FeatureDeleted]: 'text_1754570508183pw3m9k2lv68',
  [ActivityTypeEnum.FeatureUpdated]: 'text_1754570508183pw3m9k2lv69',
  [ActivityTypeEnum.InvoiceCreated]: 'text_174740465663205ip0mama6w',
  [ActivityTypeEnum.InvoiceDrafted]: 'text_1747404656632jux35a9cxrt',
  [ActivityTypeEnum.InvoiceFailed]: 'text_1747404656632twxlowkc160',
  [ActivityTypeEnum.InvoiceGenerated]: 'text_174740465663232x0p7cp9d3',
  [ActivityTypeEnum.InvoiceRegenerated]: 'text_174740465663232x0p7cp9d3',
  [ActivityTypeEnum.InvoiceOneOffCreated]: 'text_174740465663240bop3g6rbp',
  [ActivityTypeEnum.InvoicePaidCreditAdded]: 'text_1747404656632eu9n87cmyi2',
  [ActivityTypeEnum.InvoicePaymentFailure]: 'text_1747404656632e428r46tabf',
  [ActivityTypeEnum.InvoicePaymentOverdue]: 'text_1747404656632mx2lodxufuz',
  [ActivityTypeEnum.InvoicePaymentStatusUpdated]: 'text_1747404656632gzd7vuk85kk',
  [ActivityTypeEnum.InvoiceVoided]: 'text_174740465663220m8nkwjqjq',
  [ActivityTypeEnum.PaymentReceiptCreated]: 'text_1747404656632xnc93fx6cw8',
  [ActivityTypeEnum.PaymentReceiptGenerated]: 'text_1747404806714bdtx6o45wx8',
  [ActivityTypeEnum.PaymentRequestCreated]: 'text_1749561986883tqfllead7o3',
  [ActivityTypeEnum.PaymentRecorded]: 'text_1747404806714jl31k553sr3',
  [ActivityTypeEnum.PlanCreated]: 'text_17474046566311qv73xswmnm',
  [ActivityTypeEnum.PlanDeleted]: 'text_1747404656631vh02b35uq80',
  [ActivityTypeEnum.PlanUpdated]: 'text_1747404656631mkfxe18tzkx',
  [ActivityTypeEnum.SubscriptionStarted]: 'text_1747404806714xgkold0s07a',
  [ActivityTypeEnum.SubscriptionTerminated]: 'text_1747404806714tszk62qvleq',
  [ActivityTypeEnum.SubscriptionUpdated]: 'text_1747404806714d01vx7xuhzc',
  [ActivityTypeEnum.WalletCreated]: 'text_1747404806714dnwyhj6r0l9',
  [ActivityTypeEnum.WalletTransactionCreated]: 'text_1747404806714tl9vk3y3mzw',
  [ActivityTypeEnum.WalletTransactionPaymentFailure]: 'text_1747404806714mghtx7cickp',
  [ActivityTypeEnum.WalletTransactionUpdated]: 'text_1747404806714etwdmgd36ni',
  [ActivityTypeEnum.WalletUpdated]: 'text_1747404806714x0expgzlcnt',
}

export function getActivityDescription(
  activityType: ActivityTypeEnum,
  {
    activityObject,
    externalCustomerId,
    externalSubscriptionId,
  }: {
    activityObject: Record<string, unknown>
    externalCustomerId?: string
    externalSubscriptionId?: string
  },
): [string, Record<string, string | number>] {
  let parameters = {}
  let amount = 0
  let currency = CurrencyEnum.Usd

  switch (activityType) {
    case ActivityTypeEnum.AppliedCouponCreated:
    case ActivityTypeEnum.AppliedCouponDeleted:
      parameters = {
        couponCode: activityObject.coupon_code,
        externalCustomerId: externalCustomerId,
      }
      break
    case ActivityTypeEnum.BillableMetricCreated:
    case ActivityTypeEnum.BillableMetricDeleted:
    case ActivityTypeEnum.BillableMetricUpdated:
      parameters = {
        code: activityObject.code,
      }
      break
    case ActivityTypeEnum.BillingEntitiesCreated:
    case ActivityTypeEnum.BillingEntitiesDeleted:
    case ActivityTypeEnum.BillingEntitiesUpdated:
      parameters = {
        entityName: activityObject.name,
      }
      break
    case ActivityTypeEnum.CouponCreated:
    case ActivityTypeEnum.CouponDeleted:
    case ActivityTypeEnum.CouponUpdated:
      parameters = {
        couponCode: activityObject.code,
      }
      break
    case ActivityTypeEnum.CreditNoteCreated:
    case ActivityTypeEnum.CreditNoteGenerated:
    case ActivityTypeEnum.CreditNoteRefundFailure:
      currency = activityObject.currency as CurrencyEnum
      amount = Number(activityObject.total_amount_cents) || 0

      parameters = {
        creditNoteNumber: activityObject.number,
        totalAmount: intlFormatNumber(deserializeAmount(amount, currency), {
          style: 'currency',
          currency,
        }),
      }
      break
    case ActivityTypeEnum.CustomerCreated:
    case ActivityTypeEnum.CustomerDeleted:
    case ActivityTypeEnum.CustomerUpdated:
      parameters = {
        externalCustomerId: externalCustomerId,
      }
      break
    case ActivityTypeEnum.InvoiceCreated:
    case ActivityTypeEnum.InvoiceDrafted:
    case ActivityTypeEnum.InvoiceFailed:
    case ActivityTypeEnum.InvoiceGenerated:
    case ActivityTypeEnum.InvoiceRegenerated:
    case ActivityTypeEnum.InvoiceOneOffCreated:
    case ActivityTypeEnum.InvoicePaidCreditAdded:
    case ActivityTypeEnum.InvoicePaymentFailure:
    case ActivityTypeEnum.InvoicePaymentOverdue:
    case ActivityTypeEnum.InvoicePaymentStatusUpdated:
    case ActivityTypeEnum.InvoiceVoided:
      currency = activityObject.currency as CurrencyEnum
      amount = Number(activityObject.total_amount_cents) || 0

      parameters = {
        invoiceNumber: activityObject.number,
        totalAmount: intlFormatNumber(deserializeAmount(amount, currency), {
          style: 'currency',
          currency,
        }),
      }
      break
    case ActivityTypeEnum.FeatureCreated:
    case ActivityTypeEnum.FeatureDeleted:
    case ActivityTypeEnum.FeatureUpdated:
      parameters = {
        featureCode: activityObject.code,
      }
      break
    case ActivityTypeEnum.PaymentReceiptCreated:
    case ActivityTypeEnum.PaymentReceiptGenerated:
      parameters = {
        receiptNumber: activityObject.number,
      }
      break
    case ActivityTypeEnum.PaymentRequestCreated:
      currency = activityObject.currency as CurrencyEnum
      amount = Number(activityObject.amount_cents) || 0

      parameters = {
        amount: intlFormatNumber(deserializeAmount(amount, currency), {
          style: 'currency',
          currency,
        }),
      }

      break
    case ActivityTypeEnum.PaymentRecorded:
      currency = activityObject.currency as CurrencyEnum
      amount = Number(activityObject.amount_cents) || 0

      parameters = {
        amount: intlFormatNumber(deserializeAmount(amount, currency), {
          style: 'currency',
          currency,
        }),
      }
      break
    case ActivityTypeEnum.PlanCreated:
    case ActivityTypeEnum.PlanDeleted:
    case ActivityTypeEnum.PlanUpdated:
      parameters = {
        code: activityObject.code,
      }
      break
    case ActivityTypeEnum.SubscriptionStarted:
    case ActivityTypeEnum.SubscriptionTerminated:
    case ActivityTypeEnum.SubscriptionUpdated:
      parameters = {
        externalSubscriptionId: externalSubscriptionId,
      }
      break
    case ActivityTypeEnum.WalletCreated:
    case ActivityTypeEnum.WalletUpdated:
      parameters = {
        walletId: activityObject.lago_id,
      }
      break
    case ActivityTypeEnum.WalletTransactionCreated:
    case ActivityTypeEnum.WalletTransactionPaymentFailure:
    case ActivityTypeEnum.WalletTransactionUpdated:
      parameters = {
        walletId: activityObject.lago_wallet_id,
        transactionId: activityObject.lago_id,
      }
      break
    default:
      exhaustiveCheck(activityType)
  }

  return [activityTypeTranslations[activityType], parameters]
}

export function formatActivityType(activityType: ActivityTypeEnum) {
  const str = String(activityType)
  // List of known action suffixes
  const actions = [
    'payment_status_updated',
    'paid_credit_added',
    'refund_failure',
    'payment_failure',
    'payment_overdue',
    'one_off_created',
    'terminated',
    'generated',
    'created',
    'deleted',
    'updated',
    'drafted',
    'failed',
    'voided',
    'recorded',
    'started',
  ]

  for (const action of actions) {
    const suffix = `_${action}`

    if (str.endsWith(suffix)) {
      return `${str.slice(0, -suffix.length)}.${action}`
    }
  }
  return str
}

export function isDeletedActivityType(activityType: ActivityTypeEnum) {
  return activityType.endsWith('deleted')
}

export function formatResourceObject(
  resource: ActivityLogDetailsFragment['resource'],
  {
    resourceType,
    activityType,
  }: {
    resourceType?: keyof typeof ResourceTypeEnum
    activityType?: ActivityTypeEnum
  },
) {
  if (!resource) return null

  let link = null

  // Deleted resources are not linkable
  if (activityType && !isDeletedActivityType(activityType)) {
    // Generate link to resource details page for those which are linkable
    switch (resourceType) {
      case 'BillableMetric':
        link = generatePath(BILLABLE_METRIC_DETAILS_ROUTE, {
          billableMetricId: resource.id,
          tab: BillableMetricDetailsTabsOptionsEnum.overview,
        })
        break
      case 'BillingEntity':
        link = generatePath(BILLING_ENTITY_ROUTE, {
          billingEntityCode: (resource as BillingEntity).code,
        })
        break
      case 'Coupon':
        link = generatePath(COUPON_DETAILS_ROUTE, {
          couponId: resource.id,
          tab: CouponDetailsTabsOptionsEnum.overview,
        })
        break
      case 'CreditNote':
        if ((resource as CreditNote).customer?.id && (resource as CreditNote).invoice?.id) {
          link = generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
            customerId: (resource as CreditNote).customer?.id,
            invoiceId: (resource as CreditNote).invoice?.id as string | null,
            creditNoteId: resource.id,
          })
        }
        break
      case 'Invoice':
        link = generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          customerId: (resource as Invoice).customer?.id,
          invoiceId: resource.id,
          tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
        })
        break
      case 'Feature':
        link = generatePath(FEATURE_DETAILS_ROUTE, {
          featureId: resource.id,
          tab: FeatureDetailsTabsOptionsEnum.overview,
        })
        break
      case 'Plan':
        link = generatePath(PLAN_DETAILS_ROUTE, {
          planId: resource.id,
          tab: PlanDetailsTabsOptionsEnum.overview,
        })
        break
      case 'Wallet':
        link = generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
          // @ts-expect-error - walletCustomer is not typed in the graphql schema
          customerId: (resource as Wallet).walletCustomer?.id,
          tab: CustomerDetailsTabsOptions.wallet,
        })
        break
      // Other resources are not linkable because they require more params in their URL
      default:
        break
    }
  }

  return link ? (
    <a href={link} className="visited:text-blue">
      {resource.id}
    </a>
  ) : (
    resource.id
  )
}

export const resourceTypeTranslations: Record<string, string> = {
  BillableMetric: 'text_64352657267c3d916f962757',
  BillingEntity: 'text_1743077296189ms0shds6g53',
  Coupon: 'text_628b8c693e464200e00e4677',
  CreditNote: 'text_1748341883774iypsrgem3hr',
  Customer: 'text_65201c5a175a4b0238abf29a',
  Invoice: 'text_63fcc3218d35b9377840f5b3',
  Plan: 'text_63d3a658c6d84a5843032145',
  PaymentRequest: 'text_17495622741665lrk6dp6czk',
  Subscription: 'text_1728472697691k6k2e9m5ibb',
  Wallet: 'text_62d175066d2dbf1d50bc9384',
}

export function buildLinkToActivityLog(activityId: string, filter?: AvailableFiltersEnum): string {
  const searchParams = new URLSearchParams()
  const path = generatePath(ACTIVITY_LOG_ROUTE, { logId: activityId })

  setFilterValue({
    searchParams,
    prefix: ACTIVITY_LOG_FILTER_PREFIX,
    key: filter ?? AvailableFiltersEnum.activityIds,
    value: activityId,
  })

  if (searchParams.size > 0) {
    return `${path}?${searchParams.toString()}`
  }

  return path
}
