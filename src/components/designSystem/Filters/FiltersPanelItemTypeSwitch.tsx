import { Typography } from '~/components/designSystem'
import { FiltersItemActivityIds } from '~/components/designSystem/Filters/filtersElements/FiltersItemActivityIds'
import { FiltersItemActivitySources } from '~/components/designSystem/Filters/filtersElements/FiltersItemActivitySources'
import { FiltersItemActivityTypes } from '~/components/designSystem/Filters/filtersElements/FiltersItemActivityTypes'
import { FiltersItemAmount } from '~/components/designSystem/Filters/filtersElements/FiltersItemAmount'
import { FiltersItemApiKeyIds } from '~/components/designSystem/Filters/filtersElements/FiltersItemApiKeyIds'
import { FiltersItemBillingEntity } from '~/components/designSystem/Filters/filtersElements/FiltersItemBillingEntity'
import { FiltersItemCountry } from '~/components/designSystem/Filters/filtersElements/FiltersItemCountry'
import { FiltersItemCreditNoteCreditStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemCreditNoteCreditStatus'
import { FiltersItemCreditNoteReason } from '~/components/designSystem/Filters/filtersElements/FiltersItemCreditNoteReason'
import { FiltersItemCreditNoteRefundStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemCreditNoteRefundStatus'
import { FiltersItemCurrency } from '~/components/designSystem/Filters/filtersElements/FiltersItemCurrency'
import { FiltersItemCustomer } from '~/components/designSystem/Filters/filtersElements/FiltersItemCustomer'
import { FiltersItemCustomerAccountType } from '~/components/designSystem/Filters/filtersElements/FiltersItemCustomerAccountType'
import { FiltersItemCustomerType } from '~/components/designSystem/Filters/filtersElements/FiltersItemCustomerType'
import { FiltersItemDate } from '~/components/designSystem/Filters/filtersElements/FiltersItemDate'
import { FiltersItemInvoiceNumber } from '~/components/designSystem/Filters/filtersElements/FiltersItemInvoiceNumber'
import { FiltersItemInvoiceType } from '~/components/designSystem/Filters/filtersElements/FiltersItemInvoiceType'
import { FiltersItemIssuingDate } from '~/components/designSystem/Filters/filtersElements/FiltersItemIssuingDate'
import { FiltersItemLoggedDate } from '~/components/designSystem/Filters/filtersElements/FiltersItemLoggedDate'
import { FiltersItemPartiallyPaid } from '~/components/designSystem/Filters/filtersElements/FiltersItemPartiallyPaid'
import { FiltersItemPaymentDisputeLost } from '~/components/designSystem/Filters/filtersElements/FiltersItemPaymentDisputeLost'
import { FiltersItemPaymentOverdue } from '~/components/designSystem/Filters/filtersElements/FiltersItemPaymentOverdue'
import { FiltersItemPaymentStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemPaymentStatus'
import { FiltersItemPeriod } from '~/components/designSystem/Filters/filtersElements/FiltersItemPeriod'
import { FiltersItemPlanCode } from '~/components/designSystem/Filters/filtersElements/FiltersItemPlanCode'
import { FiltersItemResourceIds } from '~/components/designSystem/Filters/filtersElements/FiltersItemResourceIds'
import { FiltersItemResourceTypes } from '~/components/designSystem/Filters/filtersElements/FiltersItemResourceTypes'
import { FiltersItemSelfBilled } from '~/components/designSystem/Filters/filtersElements/FiltersItemSelfBilled'
import { FiltersItemStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemStatus'
import { FiltersItemSubscription } from '~/components/designSystem/Filters/filtersElements/FiltersItemSubscription'
import { FiltersItemWebhookStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemWebhookStatus'
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
    [AvailableFiltersEnum.amount]: <FiltersItemAmount {...props} />,
    [AvailableFiltersEnum.apiKeyIds]: <FiltersItemApiKeyIds {...props} />,
    [AvailableFiltersEnum.billingEntityIds]: <FiltersItemBillingEntity {...props} />,
    [AvailableFiltersEnum.country]: <FiltersItemCountry {...props} />,
    [AvailableFiltersEnum.creditNoteCreditStatus]: <FiltersItemCreditNoteCreditStatus {...props} />,
    [AvailableFiltersEnum.creditNoteReason]: <FiltersItemCreditNoteReason {...props} />,
    [AvailableFiltersEnum.creditNoteRefundStatus]: <FiltersItemCreditNoteRefundStatus {...props} />,
    [AvailableFiltersEnum.currency]: <FiltersItemCurrency {...props} />,
    [AvailableFiltersEnum.customerType]: <FiltersItemCustomerType {...props} />,
    [AvailableFiltersEnum.customerAccountType]: <FiltersItemCustomerAccountType {...props} />,
    [AvailableFiltersEnum.timeGranularity]: null, // Used in quick filters only
    [AvailableFiltersEnum.customerExternalId]: <FiltersItemCustomer {...props} />,
    [AvailableFiltersEnum.date]: <FiltersItemDate {...props} />,
    [AvailableFiltersEnum.invoiceNumber]: <FiltersItemInvoiceNumber {...props} />,
    [AvailableFiltersEnum.invoiceType]: <FiltersItemInvoiceType {...props} />,
    [AvailableFiltersEnum.issuingDate]: <FiltersItemIssuingDate {...props} />,
    [AvailableFiltersEnum.loggedDate]: <FiltersItemLoggedDate {...props} />,
    [AvailableFiltersEnum.partiallyPaid]: <FiltersItemPartiallyPaid {...props} />,
    [AvailableFiltersEnum.paymentDisputeLost]: <FiltersItemPaymentDisputeLost {...props} />,
    [AvailableFiltersEnum.paymentOverdue]: <FiltersItemPaymentOverdue {...props} />,
    [AvailableFiltersEnum.paymentStatus]: <FiltersItemPaymentStatus {...props} />,
    [AvailableFiltersEnum.period]: <FiltersItemPeriod {...props} />,
    [AvailableFiltersEnum.planCode]: <FiltersItemPlanCode {...props} />,
    [AvailableFiltersEnum.resourceIds]: <FiltersItemResourceIds {...props} />,
    [AvailableFiltersEnum.resourceTypes]: <FiltersItemResourceTypes {...props} />,
    [AvailableFiltersEnum.selfBilled]: <FiltersItemSelfBilled {...props} />,
    [AvailableFiltersEnum.status]: <FiltersItemStatus {...props} />,
    [AvailableFiltersEnum.subscriptionExternalId]: <FiltersItemSubscription {...props} />,
    [AvailableFiltersEnum.webhookStatus]: <FiltersItemWebhookStatus {...props} />,
  }

  return (
    <>
      {FiltersItemDates.includes(filterType) ? (
        <Typography variant="body" color="grey700">
          {translate('text_66ab42d4ece7e6b7078993e2')}
        </Typography>
      ) : (
        <Typography variant="body" color="grey700">
          {translate('text_66ab42d4ece7e6b7078993d0')}
        </Typography>
      )}

      {filterTypeMap[filterType]}
    </>
  )
}
