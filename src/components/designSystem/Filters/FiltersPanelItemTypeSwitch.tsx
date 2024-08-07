import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { HEADER_TABLE_HEIGHT, theme } from '~/styles'

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
    return <NoFilterTypePlaceholder />
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

const NoFilterTypePlaceholder = styled.div`
  /* -2px stand for the border witdh included on both top and bottom */
  height: ${HEADER_TABLE_HEIGHT - 2}px;
  border: 1px dashed ${theme.palette.grey[300]};
  border-radius: ${theme.shape.borderRadius}px;

  ${theme.breakpoints.up('lg')} {
    flex: 1;
  }
`
