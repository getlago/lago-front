import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersItemCurrency } from './filtersElements/FiltersItemCurrency'
import { FiltersItemCustomer } from './filtersElements/FiltersItemCustomer'
import { FiltersItemInvoiceType } from './filtersElements/FiltersItemInvoiceType'
import { FiltersItemIssuingDate } from './filtersElements/FiltersItemIssuingDate'
import { FiltersItemPaymentDisputeLost } from './filtersElements/FiltersItemPaymentDisputeLost'
import { FiltersItemPaymentOverdue } from './filtersElements/FiltersItemPaymentOverdue'
import { FiltersItemPaymentStatus } from './filtersElements/FiltersItemPaymentStatus'
import { FiltersItemStatus } from './filtersElements/FiltersItemStatus'
import { FiltersFormValues } from './FiltersPanelPoper'
import { AvailableFiltersEnum } from './types'

type FiltersPanelItemTypeSwitchProps = {
  filterType: AvailableFiltersEnum | undefined
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersPanelItemTypeSwitch = ({
  filterType,
  value,
  setFilterValue,
}: FiltersPanelItemTypeSwitchProps) => {
  const { translate } = useInternationalization()

  if (!filterType) {
    return <div className="h-[46px] rounded-xl border border-dashed border-grey-300 lg:flex-1" />
  }

  return (
    <>
      {filterType === AvailableFiltersEnum.issuingDate ? (
        <Typography variant="body" color="grey700">
          {translate('text_66ab42d4ece7e6b7078993e2')}
        </Typography>
      ) : (
        <Typography variant="body" color="grey700">
          {translate('text_66ab42d4ece7e6b7078993d0')}
        </Typography>
      )}

      {filterType === AvailableFiltersEnum.currency ? (
        <FiltersItemCurrency value={value} setFilterValue={setFilterValue} />
      ) : filterType === AvailableFiltersEnum.customerExternalId ? (
        <FiltersItemCustomer value={value} setFilterValue={setFilterValue} />
      ) : filterType === AvailableFiltersEnum.invoiceType ? (
        <FiltersItemInvoiceType value={value} setFilterValue={setFilterValue} />
      ) : filterType === AvailableFiltersEnum.issuingDate ? (
        <FiltersItemIssuingDate value={value} setFilterValue={setFilterValue} />
      ) : filterType === AvailableFiltersEnum.paymentDisputeLost ? (
        <FiltersItemPaymentDisputeLost value={value} setFilterValue={setFilterValue} />
      ) : filterType === AvailableFiltersEnum.paymentOverdue ? (
        <FiltersItemPaymentOverdue value={value} setFilterValue={setFilterValue} />
      ) : filterType === AvailableFiltersEnum.paymentStatus ? (
        <FiltersItemPaymentStatus value={value} setFilterValue={setFilterValue} />
      ) : filterType === AvailableFiltersEnum.status ? (
        <FiltersItemStatus value={value} setFilterValue={setFilterValue} />
      ) : null}
    </>
  )
}
