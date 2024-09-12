import { gql } from '@apollo/client'
import { generatePath, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { CustomerInvoicesList } from '~/components/customers/CustomerInvoicesList'
import { computeCustomerName } from '~/components/customers/utils'
import { Avatar, Button, Icon, Skeleton, Typography } from '~/components/designSystem'
import { SearchInput } from '~/components/SearchInput'
import { CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import {
  InvoiceForInvoiceListFragmentDoc,
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetCustomerDraftInvoicesLazyQuery,
  useGetCustomerInfosForDraftInvoicesListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { NAV_HEIGHT, PageHeader, theme } from '~/styles'

import { CustomerDetailsTabsOptions } from './CustomerDetails'

gql`
  query getCustomerDraftInvoices(
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

  query getCustomerInfosForDraftInvoicesList($customerId: ID!, $status: [InvoiceStatusTypeEnum!]) {
    customer(id: $customerId) {
      id
      name
      displayName
      applicableTimezone
    }

    customerInvoices(customerId: $customerId, status: $status) {
      metadata {
        totalCount
      }
    }
  }

  ${InvoiceForInvoiceListFragmentDoc}
`

const CustomerDraftInvoicesList = () => {
  const { customerId = '' } = useParams()
  const { goBack } = useLocationHistory()
  const { translate } = useInternationalization()
  const [getDraftInvoices, { data, error, loading, fetchMore }] =
    useGetCustomerDraftInvoicesLazyQuery({
      variables: { customerId, limit: 20, status: [InvoiceStatusTypeEnum.Draft] },
    })
  const { data: customerData, loading: customerLoading } =
    useGetCustomerInfosForDraftInvoicesListQuery({
      variables: {
        customerId,
        status: [InvoiceStatusTypeEnum.Draft],
      },
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getDraftInvoices, loading)
  const safeTimezone = customerData?.customer?.applicableTimezone || TimezoneEnum.TzUtc
  const customerName = computeCustomerName(customerData?.customer)

  return (
    <>
      <PageHeader $withSide>
        <HeaderLeft>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() =>
              goBack(
                generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                  customerId,
                  tab: CustomerDetailsTabsOptions.invoices,
                }),
              )
            }
          />
          <Typography variant="bodyHl" color="textSecondary">
            {translate('text_638f74bb4d41e3f1d0201647')}
          </Typography>
        </HeaderLeft>
      </PageHeader>

      <Wrapper>
        {customerLoading ? (
          <MainInfos>
            <Skeleton variant="userAvatar" size="large" />
            <div>
              <Skeleton variant="text" height={12} width={200} marginBottom={theme.spacing(5)} />
              <Skeleton variant="text" height={12} width={128} />
            </div>
          </MainInfos>
        ) : (
          <MainInfos>
            <Avatar size="large" variant="connector">
              <Icon name="document" />
            </Avatar>
            <div>
              <Name color="textSecondary" variant="headline">
                {translate('text_638f74bb4d41e3f1d0201649', {
                  customerName,
                })}
              </Name>
              <Typography>
                {translate('text_638f74bb4d41e3f1d020164b', {
                  count: customerData?.customerInvoices?.metadata?.totalCount,
                })}
              </Typography>
            </div>
          </MainInfos>
        )}

        <ListHeader>
          <Typography variant="bodyHl" color="textSecondary">
            {translate('text_63c6cac5c1fc58028d0235dd')}
          </Typography>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63c6cac5c1fc58028d0235d9')}
          />
        </ListHeader>

        <CustomerInvoicesList
          isLoading={isLoading}
          hasError={!!error}
          customerTimezone={safeTimezone}
          customerId={customerId}
          invoiceData={data?.customerInvoices}
          fetchMore={fetchMore}
        />
      </Wrapper>
    </>
  )
}

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const ListHeader = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Wrapper = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
`

const MainInfos = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing(8)};

  > *:first-child {
    margin-right: ${theme.spacing(4)};
  }
`

const Name = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`

export default CustomerDraftInvoicesList
