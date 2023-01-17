import { useParams, generatePath } from 'react-router-dom'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Typography, Skeleton, ButtonLink, Avatar, Icon } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CUSTOMER_DETAILS_TAB_ROUTE, CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import {
  InvoiceStatusTypeEnum,
  TimezoneEnum,
  useGetCustomerDraftInvoicesQuery,
  InvoiceForInvoiceListFragmentDoc,
} from '~/generated/graphql'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import { PageHeader, theme } from '~/styles'
import { CustomerInvoicesList } from '~/components/customers/CustomerInvoicesList'

import { CustomerDetailsTabsOptions } from './CustomerDetails'

gql`
  query getCustomerDraftInvoices(
    $customerId: ID!
    $limit: Int
    $page: Int
    $status: InvoiceStatusTypeEnum
  ) {
    customerInvoices(customerId: $customerId, limit: $limit, page: $page, status: $status) {
      ...InvoiceForInvoiceList
    }
    customer(id: $customerId) {
      id
      name
      externalId
      applicableTimezone
    }
  }

  ${InvoiceForInvoiceListFragmentDoc}
`

const CustomerDraftInvoicesList = () => {
  const { id: customerId = '' } = useParams()
  const { translate } = useInternationalization()
  const { data, loading, fetchMore } = useGetCustomerDraftInvoicesQuery({
    variables: { customerId, limit: 20, status: InvoiceStatusTypeEnum.Draft },
  })
  const safeTimezone = data?.customer?.applicableTimezone || TimezoneEnum.TzUtc

  return (
    <>
      <PageHeader>
        <HeaderLeft>
          <ButtonLink
            to={generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
              id: customerId,
              tab: CustomerDetailsTabsOptions.invoices,
            })}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_638f74bb4d41e3f1d0201647')}
            </Typography>
          )}
        </HeaderLeft>
      </PageHeader>

      <Wrapper>
        {loading ? (
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
                  customerName: data?.customer?.name,
                })}
              </Name>
              <Typography>
                {translate('text_638f74bb4d41e3f1d020164b', {
                  count: data?.customerInvoices.metadata.totalCount,
                })}
              </Typography>
            </div>
          </MainInfos>
        )}

        <CustomerInvoicesList
          isLoading={loading}
          customerTimezone={safeTimezone}
          invoiceData={data?.customerInvoices}
          getOnClickLink={(id) =>
            generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
              id: customerId,
              invoiceId: id,
              tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
            })
          }
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
