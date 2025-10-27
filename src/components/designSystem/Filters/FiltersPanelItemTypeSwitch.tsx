import { Typography } from '~/components/designSystem'
import { FiltersItemActiveSubscriptions } from '~/components/designSystem/Filters/filtersElements/FiltersItemActiveSubscriptions'
import { FiltersItemActivityIds } from '~/components/designSystem/Filters/filtersElements/FiltersItemActivityIds'
import { FiltersItemActivitySources } from '~/components/designSystem/Filters/filtersElements/FiltersItemActivitySources'
import { FiltersItemActivityTypes } from '~/components/designSystem/Filters/filtersElements/FiltersItemActivityTypes'
import { FiltersItemAmount } from '~/components/designSystem/Filters/filtersElements/FiltersItemAmount'
import { FiltersItemApiKeyIds } from '~/components/designSystem/Filters/filtersElements/FiltersItemApiKeyIds'
import { FiltersItemBillableMetricCode } from '~/components/designSystem/Filters/filtersElements/FiltersItemBillableMetricCode'
import { FiltersItemBillingEntity } from '~/components/designSystem/Filters/filtersElements/FiltersItemBillingEntity'
import { FiltersItemBillingEntityCode } from '~/components/designSystem/Filters/filtersElements/FiltersItemBillingEntityCode'
import { FiltersItemCountries } from '~/components/designSystem/Filters/filtersElements/FiltersItemCountries'
import { FiltersItemCountry } from '~/components/designSystem/Filters/filtersElements/FiltersItemCountry'
import { FiltersItemCreditNoteCreditStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemCreditNoteCreditStatus'
import { FiltersItemCreditNoteReason } from '~/components/designSystem/Filters/filtersElements/FiltersItemCreditNoteReason'
import { FiltersItemCreditNoteRefundStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemCreditNoteRefundStatus'
import { FiltersItemCurrencies } from '~/components/designSystem/Filters/filtersElements/FiltersItemCurrencies'
import { FiltersItemCurrency } from '~/components/designSystem/Filters/filtersElements/FiltersItemCurrency'
import { FiltersItemCustomer } from '~/components/designSystem/Filters/filtersElements/FiltersItemCustomer'
import { FiltersItemCustomerAccountType } from '~/components/designSystem/Filters/filtersElements/FiltersItemCustomerAccountType'
import { FiltersItemCustomerType } from '~/components/designSystem/Filters/filtersElements/FiltersItemCustomerType'
import { FiltersItemDate } from '~/components/designSystem/Filters/filtersElements/FiltersItemDate'
import { FiltersItemHasCustomerType } from '~/components/designSystem/Filters/filtersElements/FiltersItemHasCustomerType'
import { FiltersItemHttpMethods } from '~/components/designSystem/Filters/filtersElements/FiltersItemHttpMethods'
import { FiltersItemHttpStatuses } from '~/components/designSystem/Filters/filtersElements/FiltersItemHttpStatuses'
import { FiltersItemInvoiceNumber } from '~/components/designSystem/Filters/filtersElements/FiltersItemInvoiceNumber'
import { FiltersItemInvoiceType } from '~/components/designSystem/Filters/filtersElements/FiltersItemInvoiceType'
import { FiltersItemIsCustomerTinEmpty } from '~/components/designSystem/Filters/filtersElements/FiltersItemIsCustomerTinEmpty'
import { FiltersItemIssuingDate } from '~/components/designSystem/Filters/filtersElements/FiltersItemIssuingDate'
import { FiltersItemLoggedDate } from '~/components/designSystem/Filters/filtersElements/FiltersItemLoggedDate'
import { FiltersItemMetadata } from '~/components/designSystem/Filters/filtersElements/FiltersItemMetadata'
import { FiltersItemOverridden } from '~/components/designSystem/Filters/filtersElements/FiltersItemOverridden'
import { FiltersItemPartiallyPaid } from '~/components/designSystem/Filters/filtersElements/FiltersItemPartiallyPaid'
import { FiltersItemPaymentDisputeLost } from '~/components/designSystem/Filters/filtersElements/FiltersItemPaymentDisputeLost'
import { FiltersItemPaymentOverdue } from '~/components/designSystem/Filters/filtersElements/FiltersItemPaymentOverdue'
import { FiltersItemPaymentStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemPaymentStatus'
import { FiltersItemPeriod } from '~/components/designSystem/Filters/filtersElements/FiltersItemPeriod'
import { FiltersItemPlanCode } from '~/components/designSystem/Filters/filtersElements/FiltersItemPlanCode'
import { FiltersItemRequestPath } from '~/components/designSystem/Filters/filtersElements/FiltersItemRequestPath'
import { FiltersItemResourceIds } from '~/components/designSystem/Filters/filtersElements/FiltersItemResourceIds'
import { FiltersItemResourceTypes } from '~/components/designSystem/Filters/filtersElements/FiltersItemResourceTypes'
import { FiltersItemSelfBilled } from '~/components/designSystem/Filters/filtersElements/FiltersItemSelfBilled'
import { FiltersItemStates } from '~/components/designSystem/Filters/filtersElements/FiltersItemStates'
import { FiltersItemStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemStatus'
import { FiltersItemSubscription } from '~/components/designSystem/Filters/filtersElements/FiltersItemSubscription'
import { FiltersItemSubscriptionStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemSubscriptionStatus'
import { FiltersItemUserEmails } from '~/components/designSystem/Filters/filtersElements/FiltersItemUserEmails'
import { FiltersItemWebhookStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemWebhookStatus'
import { FiltersItemZipcodes } from '~/components/designSystem/Filters/filtersElements/FiltersItemZipcodes'
import { FiltersItemDates } from '~/components/designSystem/Filters/utils'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { AvailableFiltersEnum, FiltersFormValues } from './types'

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
    return <div className="h-[46px] rounded-xl border border-dashed border-grey-300 lg:flex-1" />
  }

  const filterTypeMap: Record<AvailableFiltersEnum, React.ReactNode> = {
    [AvailableFiltersEnum.activityIds]: <FiltersItemActivityIds {...props} />,
    [AvailableFiltersEnum.activitySources]: <FiltersItemActivitySources {...props} />,
    [AvailableFiltersEnum.activityTypes]: <FiltersItemActivityTypes {...props} />,
    [AvailableFiltersEnum.activeSubscriptions]: <FiltersItemActiveSubscriptions {...props} />,
    [AvailableFiltersEnum.amount]: <FiltersItemAmount {...props} />,
    [AvailableFiltersEnum.apiKeyIds]: <FiltersItemApiKeyIds {...props} />,
    [AvailableFiltersEnum.billingEntityIds]: <FiltersItemBillingEntity {...props} />,
    [AvailableFiltersEnum.billingEntityCode]: <FiltersItemBillingEntityCode {...props} />,
    [AvailableFiltersEnum.country]: <FiltersItemCountry {...props} />,
    [AvailableFiltersEnum.countries]: <FiltersItemCountries {...props} />,
    [AvailableFiltersEnum.creditNoteCreditStatus]: <FiltersItemCreditNoteCreditStatus {...props} />,
    [AvailableFiltersEnum.creditNoteReason]: <FiltersItemCreditNoteReason {...props} />,
    [AvailableFiltersEnum.creditNoteRefundStatus]: <FiltersItemCreditNoteRefundStatus {...props} />,
    [AvailableFiltersEnum.currency]: <FiltersItemCurrency {...props} />,
    [AvailableFiltersEnum.currencies]: <FiltersItemCurrencies {...props} />,
    [AvailableFiltersEnum.customerType]: <FiltersItemCustomerType {...props} />,
    [AvailableFiltersEnum.customerAccountType]: <FiltersItemCustomerAccountType {...props} />,
    [AvailableFiltersEnum.timeGranularity]: null, // Used in quick filters only
    [AvailableFiltersEnum.customerExternalId]: <FiltersItemCustomer {...props} />,
    [AvailableFiltersEnum.date]: <FiltersItemDate {...props} />,
    [AvailableFiltersEnum.hasCustomerType]: <FiltersItemHasCustomerType {...props} />,
    [AvailableFiltersEnum.httpMethods]: <FiltersItemHttpMethods {...props} />,
    [AvailableFiltersEnum.httpStatuses]: <FiltersItemHttpStatuses {...props} />,
    [AvailableFiltersEnum.invoiceNumber]: <FiltersItemInvoiceNumber {...props} />,
    [AvailableFiltersEnum.invoiceType]: <FiltersItemInvoiceType {...props} />,
    [AvailableFiltersEnum.issuingDate]: <FiltersItemIssuingDate {...props} />,
    [AvailableFiltersEnum.loggedDate]: <FiltersItemLoggedDate {...props} />,
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
    [AvailableFiltersEnum.states]: <FiltersItemStates {...props} />,
    [AvailableFiltersEnum.status]: <FiltersItemStatus {...props} />,
    [AvailableFiltersEnum.subscriptionStatus]: <FiltersItemSubscriptionStatus {...props} />,
    [AvailableFiltersEnum.subscriptionExternalId]: <FiltersItemSubscription {...props} />,
    [AvailableFiltersEnum.userEmails]: <FiltersItemUserEmails {...props} />,
    [AvailableFiltersEnum.webhookStatus]: <FiltersItemWebhookStatus {...props} />,
    [AvailableFiltersEnum.isCustomerTinEmpty]: <FiltersItemIsCustomerTinEmpty {...props} />,
    [AvailableFiltersEnum.zipcodes]: <FiltersItemZipcodes {...props} />,
    [AvailableFiltersEnum.billableMetricCode]: <FiltersItemBillableMetricCode {...props} />,
  }

  return (
    <>
      {FiltersItemDates.includes(filterType) ? (
        <Typography variant="body" color="grey700">
          {translate('text_66ab42d4ece7e6b7078993e2')}
        </Typography>
      ) : (
        /**
         * Filter metadata is more complex with multiple key/value pairs, so we don't show this text
         * for that specific filter type
         */
        filterType !== 'metadata' && (
          <Typography variant="body" color="grey700">
            {translate('text_66ab42d4ece7e6b7078993d0')}
          </Typography>
        )
      )}

      {filterTypeMap[filterType]}
    </>
  )
}
