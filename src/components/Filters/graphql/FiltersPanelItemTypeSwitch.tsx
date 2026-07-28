import { Typography } from '~/components/designSystem/Typography'
import { FiltersItemActiveSubscriptions } from '~/components/Filters/graphql/filtersElements/FiltersItemActiveSubscriptions'
import { FiltersItemActivityIds } from '~/components/Filters/graphql/filtersElements/FiltersItemActivityIds'
import { FiltersItemActivitySources } from '~/components/Filters/graphql/filtersElements/FiltersItemActivitySources'
import { FiltersItemActivityTypes } from '~/components/Filters/graphql/filtersElements/FiltersItemActivityTypes'
import { FiltersItemAmount } from '~/components/Filters/graphql/filtersElements/FiltersItemAmount'
import { FiltersItemApiKeyIds } from '~/components/Filters/graphql/filtersElements/FiltersItemApiKeyIds'
import { FiltersItemBillableMetricCode } from '~/components/Filters/graphql/filtersElements/FiltersItemBillableMetricCode'
import { FiltersItemBillingEntity } from '~/components/Filters/graphql/filtersElements/FiltersItemBillingEntity'
import { FiltersItemBillingEntityCode } from '~/components/Filters/graphql/filtersElements/FiltersItemBillingEntityCode'
import { FiltersItemBillingEntityId } from '~/components/Filters/graphql/filtersElements/FiltersItemBillingEntityId'
import { FiltersItemCountries } from '~/components/Filters/graphql/filtersElements/FiltersItemCountries'
import { FiltersItemCountry } from '~/components/Filters/graphql/filtersElements/FiltersItemCountry'
import { FiltersItemCreditNoteCreditStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemCreditNoteCreditStatus'
import { FiltersItemCreditNoteReason } from '~/components/Filters/graphql/filtersElements/FiltersItemCreditNoteReason'
import { FiltersItemCreditNoteRefundStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemCreditNoteRefundStatus'
import { FiltersItemCreditNoteType } from '~/components/Filters/graphql/filtersElements/FiltersItemCreditNoteType'
import { FiltersItemCurrencies } from '~/components/Filters/graphql/filtersElements/FiltersItemCurrencies'
import { FiltersItemCurrency } from '~/components/Filters/graphql/filtersElements/FiltersItemCurrency'
import { FiltersItemCustomer } from '~/components/Filters/graphql/filtersElements/FiltersItemCustomer'
import { FiltersItemCustomerAccountType } from '~/components/Filters/graphql/filtersElements/FiltersItemCustomerAccountType'
import { FiltersItemCustomerType } from '~/components/Filters/graphql/filtersElements/FiltersItemCustomerType'
import { FiltersItemDate } from '~/components/Filters/graphql/filtersElements/FiltersItemDate'
import { FiltersItemExternalId } from '~/components/Filters/graphql/filtersElements/FiltersItemExternalId'
import { FiltersItemHasCustomerType } from '~/components/Filters/graphql/filtersElements/FiltersItemHasCustomerType'
import { FiltersItemHttpMethods } from '~/components/Filters/graphql/filtersElements/FiltersItemHttpMethods'
import { FiltersItemHttpStatuses } from '~/components/Filters/graphql/filtersElements/FiltersItemHttpStatuses'
import { FiltersItemInvoiceNumber } from '~/components/Filters/graphql/filtersElements/FiltersItemInvoiceNumber'
import { FiltersItemInvoiceType } from '~/components/Filters/graphql/filtersElements/FiltersItemInvoiceType'
import { FiltersItemIsCustomerTinEmpty } from '~/components/Filters/graphql/filtersElements/FiltersItemIsCustomerTinEmpty'
import { FiltersItemIssuingDate } from '~/components/Filters/graphql/filtersElements/FiltersItemIssuingDate'
import { FiltersItemLogEventsAndTypes } from '~/components/Filters/graphql/filtersElements/FiltersItemLogEventsAndTypes'
import { FiltersItemLoggedDate } from '~/components/Filters/graphql/filtersElements/FiltersItemLoggedDate'
import { FiltersItemMetadata } from '~/components/Filters/graphql/filtersElements/FiltersItemMetadata'
import { FiltersItemMultipleCustomers } from '~/components/Filters/graphql/filtersElements/FiltersItemMultipleCustomers'
import { FiltersItemOrderExecutionMode } from '~/components/Filters/graphql/filtersElements/FiltersItemOrderExecutionMode'
import { FiltersItemOrderFormNumber } from '~/components/Filters/graphql/filtersElements/FiltersItemOrderFormNumber'
import { FiltersItemOrderFormStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemOrderFormStatus'
import { FiltersItemOrderNumber } from '~/components/Filters/graphql/filtersElements/FiltersItemOrderNumber'
import { FiltersItemOrderStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemOrderStatus'
import { FiltersItemOverridden } from '~/components/Filters/graphql/filtersElements/FiltersItemOverridden'
import { FiltersItemPartiallyPaid } from '~/components/Filters/graphql/filtersElements/FiltersItemPartiallyPaid'
import { FiltersItemPaymentDisputeLost } from '~/components/Filters/graphql/filtersElements/FiltersItemPaymentDisputeLost'
import { FiltersItemPaymentOverdue } from '~/components/Filters/graphql/filtersElements/FiltersItemPaymentOverdue'
import { FiltersItemPaymentStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemPaymentStatus'
import { FiltersItemPeriod } from '~/components/Filters/graphql/filtersElements/FiltersItemPeriod'
import { FiltersItemPlanCode } from '~/components/Filters/graphql/filtersElements/FiltersItemPlanCode'
import { FiltersItemQuoteNumber } from '~/components/Filters/graphql/filtersElements/FiltersItemQuoteNumber'
import { FiltersItemQuoteOrderType } from '~/components/Filters/graphql/filtersElements/FiltersItemQuoteOrderType'
import { FiltersItemQuoteStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemQuoteStatus'
import { FiltersItemRequestPath } from '~/components/Filters/graphql/filtersElements/FiltersItemRequestPath'
import { FiltersItemResourceIds } from '~/components/Filters/graphql/filtersElements/FiltersItemResourceIds'
import { FiltersItemResourceTypes } from '~/components/Filters/graphql/filtersElements/FiltersItemResourceTypes'
import { FiltersItemSelfBilled } from '~/components/Filters/graphql/filtersElements/FiltersItemSelfBilled'
import { FiltersItemSettlementType } from '~/components/Filters/graphql/filtersElements/FiltersItemSettlementType'
import { FiltersItemStates } from '~/components/Filters/graphql/filtersElements/FiltersItemStates'
import { FiltersItemStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemStatus'
import { FiltersItemSubscription } from '~/components/Filters/graphql/filtersElements/FiltersItemSubscription'
import { FiltersItemSubscriptionStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemSubscriptionStatus'
import { FiltersItemUserEmails } from '~/components/Filters/graphql/filtersElements/FiltersItemUserEmails'
import { FiltersItemUserIds } from '~/components/Filters/graphql/filtersElements/FiltersItemUserIds'
import { FiltersItemWebhookDate } from '~/components/Filters/graphql/filtersElements/FiltersItemWebhookDate'
import { FiltersItemWebhookEventTypes } from '~/components/Filters/graphql/filtersElements/FiltersItemWebhookEventTypes'
import { FiltersItemWebhookHttpStatuses } from '~/components/Filters/graphql/filtersElements/FiltersItemWebhookHttpStatuses'
import { FiltersItemWebhookStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemWebhookStatus'
import { FiltersItemZipcodes } from '~/components/Filters/graphql/filtersElements/FiltersItemZipcodes'
import { FiltersItemDates } from '~/components/Filters/graphql/utils'
import { AvailableFiltersEnum, FiltersFormValues } from '~/components/Filters/presentation/types'
import { LogEventEnum, LogTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const FILTERS_PANEL_ITEM_TYPE_SWITCH_PLACEHOLDER_TEST_ID =
  'filters-panel-item-type-switch-placeholder'
export const FILTERS_PANEL_ITEM_TYPE_SWITCH_DATE_HELP_TEST_ID =
  'filters-panel-item-type-switch-date-help'
export const FILTERS_PANEL_ITEM_TYPE_SWITCH_HELP_TEST_ID = 'filters-panel-item-type-switch-help'

type FiltersPanelItemTypeSwitchProps = {
  filterType: AvailableFiltersEnum | undefined
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersPanelItemTypeSwitch = ({
  filterType,
  ...props
}: FiltersPanelItemTypeSwitchProps) => {
  const { translate } = useInternationalization()

  if (!filterType) {
    return (
      <div
        data-test={FILTERS_PANEL_ITEM_TYPE_SWITCH_PLACEHOLDER_TEST_ID}
        className="h-[46px] rounded-xl border border-dashed border-grey-300 lg:flex-1"
      />
    )
  }

  const filterTypeMap: Record<AvailableFiltersEnum, React.ReactNode> = {
    [AvailableFiltersEnum.activityIds]: <FiltersItemActivityIds {...props} />,
    [AvailableFiltersEnum.activitySources]: <FiltersItemActivitySources {...props} />,
    [AvailableFiltersEnum.activityTypes]: <FiltersItemActivityTypes {...props} />,
    [AvailableFiltersEnum.activeSubscriptions]: <FiltersItemActiveSubscriptions {...props} />,
    [AvailableFiltersEnum.amount]: <FiltersItemAmount {...props} />,
    [AvailableFiltersEnum.apiKeyIds]: <FiltersItemApiKeyIds {...props} />,
    [AvailableFiltersEnum.billingEntityIds]: <FiltersItemBillingEntity {...props} />,
    [AvailableFiltersEnum.billingEntityId]: <FiltersItemBillingEntityId {...props} />,
    [AvailableFiltersEnum.billingEntityCode]: <FiltersItemBillingEntityCode {...props} />,
    [AvailableFiltersEnum.country]: <FiltersItemCountry {...props} />,
    [AvailableFiltersEnum.countries]: <FiltersItemCountries {...props} />,
    [AvailableFiltersEnum.creditNoteCreditStatus]: <FiltersItemCreditNoteCreditStatus {...props} />,
    [AvailableFiltersEnum.creditNoteReason]: <FiltersItemCreditNoteReason {...props} />,
    [AvailableFiltersEnum.creditNoteRefundStatus]: <FiltersItemCreditNoteRefundStatus {...props} />,
    [AvailableFiltersEnum.creditNoteType]: <FiltersItemCreditNoteType {...props} />,
    [AvailableFiltersEnum.currency]: <FiltersItemCurrency {...props} />,
    [AvailableFiltersEnum.currencies]: <FiltersItemCurrencies {...props} />,
    [AvailableFiltersEnum.customerType]: <FiltersItemCustomerType {...props} />,
    [AvailableFiltersEnum.customerAccountType]: <FiltersItemCustomerAccountType {...props} />,
    [AvailableFiltersEnum.timeGranularity]: null, // Used in quick filters only
    [AvailableFiltersEnum.customerExternalId]: <FiltersItemCustomer {...props} />,
    [AvailableFiltersEnum.externalId]: <FiltersItemExternalId {...props} />,
    [AvailableFiltersEnum.date]: <FiltersItemDate {...props} />,
    [AvailableFiltersEnum.hasCustomerType]: <FiltersItemHasCustomerType {...props} />,
    [AvailableFiltersEnum.httpMethods]: <FiltersItemHttpMethods {...props} />,
    [AvailableFiltersEnum.httpStatuses]: <FiltersItemHttpStatuses {...props} />,
    [AvailableFiltersEnum.invoiceNumber]: <FiltersItemInvoiceNumber {...props} />,
    [AvailableFiltersEnum.invoiceType]: <FiltersItemInvoiceType {...props} />,
    [AvailableFiltersEnum.issuingDate]: <FiltersItemIssuingDate {...props} />,
    [AvailableFiltersEnum.loggedDate]: <FiltersItemLoggedDate {...props} />,
    [AvailableFiltersEnum.logEvents]: (
      <FiltersItemLogEventsAndTypes {...props} enumToUse={LogEventEnum} />
    ),
    [AvailableFiltersEnum.logTypes]: (
      <FiltersItemLogEventsAndTypes {...props} enumToUse={LogTypeEnum} />
    ),
    [AvailableFiltersEnum.metadata]: <FiltersItemMetadata {...props} />,
    [AvailableFiltersEnum.overriden]: <FiltersItemOverridden {...props} />,
    [AvailableFiltersEnum.partiallyPaid]: <FiltersItemPartiallyPaid {...props} />,
    [AvailableFiltersEnum.paymentDisputeLost]: <FiltersItemPaymentDisputeLost {...props} />,
    [AvailableFiltersEnum.paymentOverdue]: <FiltersItemPaymentOverdue {...props} />,
    [AvailableFiltersEnum.paymentStatus]: <FiltersItemPaymentStatus {...props} />,
    [AvailableFiltersEnum.period]: <FiltersItemPeriod {...props} />,
    [AvailableFiltersEnum.planCode]: <FiltersItemPlanCode {...props} />,
    [AvailableFiltersEnum.requestPaths]: <FiltersItemRequestPath {...props} />,
    [AvailableFiltersEnum.resourceIds]: <FiltersItemResourceIds {...props} />,
    [AvailableFiltersEnum.resourceTypes]: <FiltersItemResourceTypes {...props} />,
    [AvailableFiltersEnum.selfBilled]: <FiltersItemSelfBilled {...props} />,
    [AvailableFiltersEnum.settlementType]: <FiltersItemSettlementType {...props} />,
    [AvailableFiltersEnum.states]: <FiltersItemStates {...props} />,
    [AvailableFiltersEnum.status]: <FiltersItemStatus {...props} />,
    [AvailableFiltersEnum.subscriptionStatus]: <FiltersItemSubscriptionStatus {...props} />,
    [AvailableFiltersEnum.subscriptionExternalId]: <FiltersItemSubscription {...props} />,
    [AvailableFiltersEnum.userEmails]: <FiltersItemUserEmails {...props} />,
    [AvailableFiltersEnum.webhookDate]: <FiltersItemWebhookDate {...props} />,
    [AvailableFiltersEnum.webhookEventTypes]: <FiltersItemWebhookEventTypes {...props} />,
    [AvailableFiltersEnum.webhookHttpStatuses]: <FiltersItemWebhookHttpStatuses {...props} />,
    [AvailableFiltersEnum.userIds]: <FiltersItemUserIds {...props} />,
    [AvailableFiltersEnum.multipleCustomers]: <FiltersItemMultipleCustomers {...props} />,
    [AvailableFiltersEnum.orderFormCreatedAt]: <FiltersItemDate {...props} />,
    [AvailableFiltersEnum.orderFormNumber]: <FiltersItemOrderFormNumber {...props} />,
    [AvailableFiltersEnum.orderFormStatus]: <FiltersItemOrderFormStatus {...props} />,
    [AvailableFiltersEnum.orderStatus]: <FiltersItemOrderStatus {...props} />,
    [AvailableFiltersEnum.orderNumber]: <FiltersItemOrderNumber {...props} />,
    [AvailableFiltersEnum.orderExecutionMode]: <FiltersItemOrderExecutionMode {...props} />,
    [AvailableFiltersEnum.orderExecutedAt]: <FiltersItemDate {...props} />,
    [AvailableFiltersEnum.quoteCreatedAt]: <FiltersItemDate {...props} />,
    [AvailableFiltersEnum.quoteNumber]: <FiltersItemQuoteNumber {...props} />,
    [AvailableFiltersEnum.quoteOrderType]: <FiltersItemQuoteOrderType {...props} />,
    [AvailableFiltersEnum.quoteStatus]: <FiltersItemQuoteStatus {...props} />,
    [AvailableFiltersEnum.webhookStatus]: <FiltersItemWebhookStatus {...props} />,
    [AvailableFiltersEnum.isCustomerTinEmpty]: <FiltersItemIsCustomerTinEmpty {...props} />,
    [AvailableFiltersEnum.zipcodes]: <FiltersItemZipcodes {...props} />,
    [AvailableFiltersEnum.billableMetricCode]: <FiltersItemBillableMetricCode {...props} />,
  }

  return (
    <>
      {FiltersItemDates.includes(filterType) ? (
        <Typography
          data-test={FILTERS_PANEL_ITEM_TYPE_SWITCH_DATE_HELP_TEST_ID}
          variant="body"
          color="grey700"
        >
          {translate('text_66ab42d4ece7e6b7078993e2')}
        </Typography>
      ) : (
        /**
         * Filter metadata is more complex with multiple key/value pairs, so we don't show this text
         * for that specific filter type
         */
        filterType !== 'metadata' && (
          <Typography
            data-test={FILTERS_PANEL_ITEM_TYPE_SWITCH_HELP_TEST_ID}
            variant="body"
            color="grey700"
          >
            {translate('text_66ab42d4ece7e6b7078993d0')}
          </Typography>
        )
      )}

      {filterTypeMap[filterType]}
    </>
  )
}
