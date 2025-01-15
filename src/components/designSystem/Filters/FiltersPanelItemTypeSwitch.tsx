import { Typography } from '~/components/designSystem'
import { FiltersItemAmount } from '~/components/designSystem/Filters/filtersElements/FiltersItemAmount'
import { FiltersItemCreditNoteCreditStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemCreditNoteCreditStatus'
import { FiltersItemCreditNoteReason } from '~/components/designSystem/Filters/filtersElements/FiltersItemCreditNoteReason'
import { FiltersItemCreditNoteRefundStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemCreditNoteRefundStatus'
import { FiltersItemInvoiceNumber } from '~/components/designSystem/Filters/filtersElements/FiltersItemInvoiceNumber'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersItemCurrency } from './filtersElements/FiltersItemCurrency'
import { FiltersItemCustomer } from './filtersElements/FiltersItemCustomer'
import { FiltersItemInvoiceType } from './filtersElements/FiltersItemInvoiceType'
import { FiltersItemIssuingDate } from './filtersElements/FiltersItemIssuingDate'
import { FiltersItemPaymentDisputeLost } from './filtersElements/FiltersItemPaymentDisputeLost'
import { FiltersItemPaymentOverdue } from './filtersElements/FiltersItemPaymentOverdue'
import { FiltersItemPaymentStatus } from './filtersElements/FiltersItemPaymentStatus'
import { FiltersItemStatus } from './filtersElements/FiltersItemStatus'
import { AvailableFiltersEnum, FiltersFormValues } from './types'

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

  const filterTypeMap: Record<AvailableFiltersEnum, React.ReactNode> = {
    [AvailableFiltersEnum.currency]: (
      <FiltersItemCurrency value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.customerExternalId]: (
      <FiltersItemCustomer value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.invoiceType]: (
      <FiltersItemInvoiceType value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.issuingDate]: (
      <FiltersItemIssuingDate value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.paymentDisputeLost]: (
      <FiltersItemPaymentDisputeLost value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.paymentOverdue]: (
      <FiltersItemPaymentOverdue value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.paymentStatus]: (
      <FiltersItemPaymentStatus value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.status]: (
      <FiltersItemStatus value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.invoiceNumber]: (
      <FiltersItemInvoiceNumber value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.amount]: (
      <FiltersItemAmount value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.creditNoteReason]: (
      <FiltersItemCreditNoteReason value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.creditNoteCreditStatus]: (
      <FiltersItemCreditNoteCreditStatus value={value} setFilterValue={setFilterValue} />
    ),
    [AvailableFiltersEnum.creditNoteRefundStatus]: (
      <FiltersItemCreditNoteRefundStatus value={value} setFilterValue={setFilterValue} />
    ),
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

      {filterTypeMap[filterType]}
    </>
  )
}
