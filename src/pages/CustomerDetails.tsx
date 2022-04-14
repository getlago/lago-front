import { gql } from '@apollo/client'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Typography, Button, Skeleton, Avatar } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { CUSTOMERS_LIST_ROUTE } from '~/core/router'
import {
  useGetCustomerQuery,
  CustomerSubscriptionListFragmentDoc,
  CustomerInvoiceListFragmentDoc,
} from '~/generated/graphql'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import EmojiError from '~/public/images/exploding-head.png'
import { CustomerSubscriptionsList } from '~/components/customers/CustomerSubscriptionsList'
import { CustomerInvoicesList } from '~/components/customers/CustomerInvoicesList'
import { theme, PageHeader } from '~/styles'
import { SectionHeader } from '~/styles/customer'

gql`
  fragment CustomerDetails on CustomerDetails {
    id
    name
    customerId
    subscriptions {
      ...CustomerSubscriptionList
    }
    invoices {
      ...CustomerInvoiceList
    }
  }

  query getCustomer($id: ID!) {
    customer(id: $id) {
      ...CustomerDetails
    }
  }

  ${CustomerSubscriptionListFragmentDoc}
  ${CustomerInvoiceListFragmentDoc}
`

const CustomerDetails = () => {
  const { translate } = useI18nContext()
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, loading, error, refetch } = useGetCustomerQuery({
    variables: { id: id as string },
    skip: !id,
  })
  const { name, customerId, invoices, subscriptions } = data?.customer || {}

  return (
    <div>
      <Header $withSide>
        <Button
          variant="quaternary"
          icon="arrow-left"
          onClick={() => navigate(CUSTOMERS_LIST_ROUTE)}
        />
        {loading ? (
          <Skeleton variant="text" height={12} width={120} />
        ) : (
          <Typography variant="bodyHl" color="textSecondary">
            {name}
          </Typography>
        )}
      </Header>
      {error && !loading ? (
        <GenericPlaceholder
          title={translate('text_6250304370f0f700a8fdc270')}
          subtitle={translate('text_6250304370f0f700a8fdc274')}
          buttonTitle={translate('text_6250304370f0f700a8fdc278')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<img src={EmojiError} alt="error-emoji" />}
        />
      ) : (
        <Content>
          {loading ? (
            <>
              <MainInfos>
                <Skeleton variant="userAvatar" size="large" />
                <div>
                  <Skeleton
                    variant="text"
                    height={12}
                    width={200}
                    marginBottom={theme.spacing(5)}
                  />
                  <Skeleton variant="text" height={12} width={128} />
                </div>
              </MainInfos>
              <Infos>
                <LoadingDetails>
                  <SectionHeader variant="subhead">
                    {translate('text_6250304370f0f700a8fdc27d')}
                  </SectionHeader>
                  <div>
                    <Skeleton
                      variant="text"
                      height={12}
                      width={80}
                      marginBottom={theme.spacing(3)}
                    />
                    <Skeleton variant="text" height={12} width={200} />
                  </div>
                  <div>
                    <Skeleton
                      variant="text"
                      height={12}
                      width={80}
                      marginBottom={theme.spacing(3)}
                    />
                    <Skeleton variant="text" height={12} width={200} />
                  </div>
                </LoadingDetails>
                <SideBlock>
                  <SideLoadingSection>
                    <SectionHeader variant="subhead">
                      {translate('text_6250304370f0f700a8fdc28d')}
                    </SectionHeader>
                    <Skeleton variant="text" height={12} width={240} />
                  </SideLoadingSection>
                  <SideLoadingSection>
                    <SectionHeader variant="subhead">
                      {translate('text_6250304370f0f700a8fdc291')}
                    </SectionHeader>
                    <Skeleton variant="text" height={12} width={240} />
                  </SideLoadingSection>
                </SideBlock>
              </Infos>
            </>
          ) : (
            <>
              <MainInfos>
                <Avatar
                  size="large"
                  variant="user"
                  identifier={name || ''}
                  initials={(name || '').split(' ').reduce((acc, n) => (acc = acc + n[0]), '')}
                />
                <div>
                  <Name color="textSecondary" variant="headline">
                    {name}
                  </Name>
                  <Typography>{customerId}</Typography>
                </div>
              </MainInfos>
              <Infos>
                <DetailsBlock>
                  <SectionHeader variant="subhead">
                    {translate('text_6250304370f0f700a8fdc27d')}
                  </SectionHeader>

                  <div>
                    <Typography variant="caption">
                      {translate('text_6250304370f0f700a8fdc283')}
                    </Typography>
                    <Typography color="textSecondary">{customerId}</Typography>
                  </div>
                </DetailsBlock>
                <SideBlock>
                  <CustomerSubscriptionsList
                    customerName={name as string}
                    customerId={customerId as string}
                    subscriptions={subscriptions ?? []}
                    refetchCustomer={refetch}
                  />
                  <CustomerInvoicesList invoices={invoices} />
                </SideBlock>
              </Infos>
            </>
          )}
        </Content>
      )}
    </div>
  )
}

const Header = styled(PageHeader)`
  justify-content: flex-start;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Content = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)} ${theme.spacing(20)};

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(8)} ${theme.spacing(4)} ${theme.spacing(20)};
  }
`

const MainInfos = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing(8)};

  > *:first-child {
    margin-right: ${theme.spacing(4)};
  }
`

const Infos = styled.div`
  display: flex;

  > *:first-child {
    width: 320px;
    margin-right: ${theme.spacing(8)};

    @media (max-width: 1024px) {
      flex: 1;
      width: inherit;
      margin-right: 0;
    }
  }
  > *:last-child {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`

const Name = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`

const LoadingDetails = styled.div`
  > *:first-child {
    margin-bottom: ${theme.spacing(7)};
  }

  > *:not(:first-child) {
    margin-bottom: ${theme.spacing(7)};
  }
`

const SideBlock = styled.div`
  > *:first-child {
    margin-bottom: ${theme.spacing(8)};
  }
`

const SideLoadingSection = styled.div`
  > *:first-child {
    margin-bottom: ${theme.spacing(8)};
  }
`

const DetailsBlock = styled.div`
  > *:first-child {
    margin-bottom: ${theme.spacing(6)};
  }

  > *:not(:first-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`

export default CustomerDetails
