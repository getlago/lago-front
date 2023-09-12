import { gql } from '@apollo/client'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { Skeleton, Typography } from '~/components/designSystem'
import { CUSTOMER_DRAFT_INVOICES_LIST_ROUTE, CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import {
  InvoiceForInvoiceListFragmentDoc,
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetCustomerInvoicesLazyQuery,
  useGetCustomerInvoicesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import { NAV_HEIGHT, theme } from '~/styles'

import { CustomerInvoicesList } from './CustomerInvoicesList'

import { SearchInput } from '../SearchInput'

const DRAFT_INVOICES_ITEMS_COUNT = 4

gql`
  query getCustomerInvoices(
    $customerId: ID!
    $limit: Int
    $page: Int
    $status: InvoiceStatusTypeEnum
    $searchTerm: String
  ) {
    customerInvoices(
      customerId: $customerId
      limit: $limit
      page: $page
      status: $status
      searchTerm: $searchTerm
    ) {
      ...InvoiceForInvoiceList
    }
  }

  ${InvoiceForInvoiceListFragmentDoc}
`

interface CustomerInvoicesTabProps {
  customerId: string
  customerTimezone?: TimezoneEnum
}

export const CustomerInvoicesTab = ({ customerId, customerTimezone }: CustomerInvoicesTabProps) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const {
    data: dataDraft,
    error: errorDraft,
    loading: loadingDraft,
  } = useGetCustomerInvoicesQuery({
    variables: {
      customerId,
      limit: DRAFT_INVOICES_ITEMS_COUNT,
      status: InvoiceStatusTypeEnum.Draft,
    },
  })
  const [
    getFinalizedInvoices,
    {
      data: dataFinalized,
      error: errorFinalized,
      fetchMore: fetchMoreFinalized,
      loading: loadingFinalized,
      variables: variablesFinalized,
    },
  ] = useGetCustomerInvoicesLazyQuery({
    variables: {
      customerId,
      limit: 20,
      status: InvoiceStatusTypeEnum.Finalized,
    },
    notifyOnNetworkStatusChange: true,
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getFinalizedInvoices, loadingFinalized)
  const initialLoad = loadingDraft && loadingFinalized
  const invoicesDraft = dataDraft?.customerInvoices.collection
  const invoicesFinalized = dataFinalized?.customerInvoices.collection

  return (
    <div>
      {initialLoad ? (
        <LoadingState>
          <Skeleton variant="text" width={224} height={12} marginBottom="30px" />
          <CustomerInvoicesList
            isLoading
            customerTimezone={customerTimezone}
            getOnClickLink={() => ''}
          />
        </LoadingState>
      ) : !invoicesDraft?.length &&
        !invoicesFinalized?.length &&
        !variablesFinalized?.searchTerm ? (
        <EmptyTitle>{translate('text_6250304370f0f700a8fdc293')}</EmptyTitle>
      ) : (
        <>
          {!!invoicesDraft?.length && (
            <DraftWrapper>
              <Title variant="subhead" color="grey700">
                {translate('text_638f4d756d899445f18a49ee')}
              </Title>
              <CustomerInvoicesList
                isLoading={loadingDraft}
                hasError={!!errorDraft}
                customerTimezone={customerTimezone}
                getOnClickLink={(id) =>
                  generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                    id: customerId,
                    invoiceId: id,
                    tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                  })
                }
                invoiceData={dataDraft?.customerInvoices}
                onSeeAll={
                  (dataDraft?.customerInvoices?.metadata?.totalCount || 0) >
                  DRAFT_INVOICES_ITEMS_COUNT
                    ? () =>
                        navigate(
                          generatePath(CUSTOMER_DRAFT_INVOICES_LIST_ROUTE, { id: customerId })
                        )
                    : undefined
                }
              />
            </DraftWrapper>
          )}

          {(loadingFinalized ||
            !!invoicesFinalized?.length ||
            !!variablesFinalized?.searchTerm) && (
            <>
              <HeaderWithSearch>
                <Title variant="subhead" color="grey700">
                  {translate('text_6250304370f0f700a8fdc291')}
                </Title>
                <SearchInput
                  onChange={debouncedSearch}
                  placeholder={translate('text_63c6861d9991cdd5a92c1419')}
                />
              </HeaderWithSearch>
              <CustomerInvoicesList
                isLoading={isLoading}
                hasError={!!errorFinalized}
                hasSearchTerm={!!variablesFinalized?.searchTerm}
                customerTimezone={customerTimezone}
                context="finalized"
                invoiceData={dataFinalized?.customerInvoices}
                getOnClickLink={(id) =>
                  generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                    id: customerId,
                    invoiceId: id,
                    tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                  })
                }
                fetchMore={fetchMoreFinalized}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

const DraftWrapper = styled.div`
  margin-bottom: ${theme.spacing(12)};
`

const HeaderWithSearch = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const EmptyTitle = styled(Typography)`
  margin-top: ${theme.spacing(6)};
`

const LoadingState = styled.div`
  margin-top: 30px;
`

const Title = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
`
