import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'

import { ButtonLink, Skeleton, Typography } from '~/components/designSystem'
import { CUSTOMER_DRAFT_INVOICES_LIST_ROUTE } from '~/core/router'
import {
  InvoiceForInvoiceListFragmentDoc,
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetCustomerInvoicesLazyQuery,
  useGetCustomerInvoicesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { NAV_HEIGHT, theme } from '~/styles'

import { CustomerInvoicesList } from './CustomerInvoicesList'

import { SearchInput } from '../SearchInput'

const DRAFT_INVOICES_ITEMS_COUNT = 4

gql`
  query getCustomerInvoices(
    $customerId: ID!
    $limit: Int
    $page: Int
    $status: [InvoiceStatusTypeEnum!]
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
  const { translate } = useInternationalization()
  const {
    data: dataDraft,
    error: errorDraft,
    loading: loadingDraft,
  } = useGetCustomerInvoicesQuery({
    variables: {
      customerId,
      limit: DRAFT_INVOICES_ITEMS_COUNT,
      status: [InvoiceStatusTypeEnum.Draft],
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
      status: [
        InvoiceStatusTypeEnum.Finalized,
        InvoiceStatusTypeEnum.Voided,
        InvoiceStatusTypeEnum.Failed,
      ],
    },
    notifyOnNetworkStatusChange: true,
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getFinalizedInvoices, loadingFinalized)
  const initialLoad = loadingDraft && loadingFinalized
  const invoicesDraft = dataDraft?.customerInvoices.collection
  const invoicesFinalized = dataFinalized?.customerInvoices.collection
  const invoicesDraftCount = dataDraft?.customerInvoices.metadata.totalCount || 0

  return (
    <div>
      {initialLoad ? (
        <LoadingState>
          <Skeleton variant="text" width={224} marginBottom="30px" />
          <CustomerInvoicesList
            isLoading
            customerTimezone={customerTimezone}
            customerId={customerId}
            context="finalized"
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
              <Header>
                <Typography variant="subhead" color="grey700">
                  {translate('text_638f4d756d899445f18a49ee')}
                </Typography>
              </Header>

              <CustomerInvoicesList
                isLoading={loadingDraft}
                hasError={!!errorDraft}
                customerTimezone={customerTimezone}
                customerId={customerId}
                invoiceData={dataDraft?.customerInvoices}
              />
              {invoicesDraftCount > DRAFT_INVOICES_ITEMS_COUNT && (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  py={theme.spacing(2)}
                  boxShadow={theme.shadows[7]}
                >
                  <ButtonLink
                    type="button"
                    to={generatePath(CUSTOMER_DRAFT_INVOICES_LIST_ROUTE, { customerId })}
                    buttonProps={{
                      variant: 'quaternary',
                    }}
                  >
                    {translate('text_638f4d756d899445f18a4a0e')}
                  </ButtonLink>
                </Stack>
              )}
            </DraftWrapper>
          )}

          {(loadingFinalized ||
            !!invoicesFinalized?.length ||
            !!variablesFinalized?.searchTerm) && (
            <>
              <Header>
                <Typography variant="subhead" color="grey700">
                  {translate('text_6250304370f0f700a8fdc291')}
                </Typography>
                <SearchInput
                  onChange={debouncedSearch}
                  placeholder={translate('text_63c6861d9991cdd5a92c1419')}
                />
              </Header>
              <CustomerInvoicesList
                isLoading={isLoading}
                hasError={!!errorFinalized}
                customerTimezone={customerTimezone}
                customerId={customerId}
                context="finalized"
                invoiceData={dataFinalized?.customerInvoices}
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

const Header = styled.div`
  height: ${NAV_HEIGHT}px;
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
