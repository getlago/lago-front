import { useParams, generatePath } from 'react-router-dom'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Typography, Skeleton, ButtonLink, Avatar, Icon } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import {
  InvoiceStatusTypeEnum,
  useGetCustomerInfosForDraftInvoicesListQuery,
  useGetCustomerInvoicesQuery,
} from '~/generated/graphql'
import { PageHeader, theme } from '~/styles'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import { InvoicesList } from '~/components/customers/InvoicesList'

gql`
  fragment InvoiceInfosForCustomerDraftInvoicesList on InvoiceCollection {
    collection {
      id
      status
    }
    metadata {
      totalCount
    }
  }

  query getCustomerInfosForDraftInvoicesList($id: ID!) {
    customer(id: $id) {
      id
      name
      externalId
    }
  }
`

const CustomerDraftInvoicesList = () => {
  const { id: customerId = '' } = useParams()
  const { translate } = useInternationalization()
  const { data: dataCustomer } = useGetCustomerInfosForDraftInvoicesListQuery({
    variables: { id: customerId },
  })
  const { data, loading, fetchMore } = useGetCustomerInvoicesQuery({
    variables: { customerId, limit: 20, status: InvoiceStatusTypeEnum.Draft },
  })

  return (
    <>
      <PageHeader>
        <HeaderLeft>
          <ButtonLink
            to={generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
              id: customerId,
              tab: CustomerInvoiceDetailsTabsOptionsEnum.invoices,
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
                  customerName: dataCustomer?.customer?.name,
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

        <InvoicesList
          customerId={customerId}
          fetchMore={fetchMore}
          invoices={data?.customerInvoices.collection}
          label={translate('text_638f4d756d899445f18a49ee')}
          loading={loading}
          metadata={data?.customerInvoices.metadata}
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
