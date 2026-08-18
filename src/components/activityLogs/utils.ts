import { generatePath } from 'react-router-dom'

import { ACTIVITY_LOG_ROUTE } from '~/components/developers/devtoolsRoutes'
import { AvailableFiltersEnum, setFilterValue } from '~/components/Filters'
import { ACTIVITY_LOG_FILTER_PREFIX } from '~/core/constants/filters'
import {
  BillableMetricDetailsTabsOptionsEnum,
  CouponDetailsTabsOptionsEnum,
  CustomerDetailsTabsOptions,
  CustomerInvoiceDetailsTabsOptionsEnum,
  FeatureDetailsTabsOptionsEnum,
  PlanDetailsTabsOptionsEnum,
  QuoteDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import {
  BILLABLE_METRIC_DETAILS_ROUTE,
  BILLING_ENTITY_ROUTE,
  COUPON_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  FEATURE_DETAILS_ROUTE,
  ORDER_DETAILS_ROUTE,
  ORDER_FORM_DETAILS_ROUTE,
  PLAN_DETAILS_ROUTE,
  QUOTE_DETAILS_ROUTE,
} from '~/core/router'
import {
  ActivityLogDetailsFragment,
  ActivityTypeEnum,
  BillingEntity,
  CreditNote,
  Invoice,
  ResourceTypeEnum,
  Wallet,
} from '~/generated/graphql'

export function formatActivityType(activityType: ActivityTypeEnum) {
  const str = String(activityType)
  // List of known action suffixes
  // Longest suffixes first: 'version_created' must win over 'created' so that
  // quote_version_created reads quote.version_created, not quote_version.created.
  const actions = [
    'payment_status_updated',
    'ready_to_finalize',
    'paid_credit_added',
    'version_created',
    'file_uploaded',
    'refund_failure',
    'payment_failure',
    'payment_overdue',
    'one_off_created',
    'terminated',
    'generated',
    'approved',
    'executed',
    'expired',
    'created',
    'deleted',
    'updated',
    'drafted',
    'failed',
    'signed',
    'voided',
    'recorded',
    'started',
    'sent',
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

/**
 * Pure mapping from an activity-log resource to the main-app path of its
 * detail page. Returns `null` when the resource has been deleted, when the
 * activityType is missing, or when the resource type is not linkable.
 */
export function getResourceLink(
  resource: ActivityLogDetailsFragment['resource'],
  {
    resourceType,
    activityType,
  }: {
    resourceType?: keyof typeof ResourceTypeEnum
    activityType?: ActivityTypeEnum
  },
): string | null {
  if (!resource) return null
  if (!activityType || isDeletedActivityType(activityType)) return null

  switch (resourceType) {
    case 'BillableMetric':
      return generatePath(BILLABLE_METRIC_DETAILS_ROUTE, {
        billableMetricId: resource.id,
        tab: BillableMetricDetailsTabsOptionsEnum.overview,
      })
    case 'BillingEntity':
      return generatePath(BILLING_ENTITY_ROUTE, {
        billingEntityCode: (resource as BillingEntity).code,
      })
    case 'Coupon':
      return generatePath(COUPON_DETAILS_ROUTE, {
        couponId: resource.id,
        tab: CouponDetailsTabsOptionsEnum.overview,
      })
    case 'CreditNote':
      if (!(resource as CreditNote).customer?.id || !(resource as CreditNote).invoice?.id) {
        return null
      }
      return generatePath(CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, {
        customerId: (resource as CreditNote).customer?.id,
        invoiceId: (resource as CreditNote).invoice?.id as string | null,
        creditNoteId: resource.id,
      })
    case 'Invoice':
      return generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
        customerId: (resource as Invoice).customer?.id,
        invoiceId: resource.id,
        tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
      })
    case 'Feature':
      return generatePath(FEATURE_DETAILS_ROUTE, {
        featureId: resource.id,
        tab: FeatureDetailsTabsOptionsEnum.overview,
      })
    case 'Order':
      return generatePath(ORDER_DETAILS_ROUTE, {
        orderId: resource.id,
      })
    case 'OrderForm':
      return generatePath(ORDER_FORM_DETAILS_ROUTE, {
        orderFormId: resource.id,
      })
    case 'Plan':
      return generatePath(PLAN_DETAILS_ROUTE, {
        planId: resource.id,
        tab: PlanDetailsTabsOptionsEnum.overview,
      })
    case 'Quote':
      return generatePath(QUOTE_DETAILS_ROUTE, {
        quoteId: resource.id,
        tab: QuoteDetailsTabsOptionsEnum.overview,
      })
    case 'Wallet':
      return generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        // @ts-expect-error - walletCustomer is not typed in the graphql schema
        customerId: (resource as Wallet).walletCustomer?.id,
        tab: CustomerDetailsTabsOptions.wallet,
      })
    // Other resources are not linkable because they require more params in their URL
    default:
      return null
  }
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
