import { useRef } from 'react'
import { gql } from '@apollo/client'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Typography, Button, Skeleton, Avatar, Popper, Tooltip } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { CUSTOMERS_LIST_ROUTE } from '~/core/router'
import {
  useGetCustomerQuery,
  CustomerSubscriptionListFragmentDoc,
  CustomerInvoiceListFragmentDoc,
  AddCustomerDialogDetailFragmentDoc,
} from '~/generated/graphql'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import EmojiError from '~/public/images/exploding-head.png'
import {
  CustomerSubscriptionsList,
  CustomerSubscriptionsListRef,
} from '~/components/customers/CustomerSubscriptionsList'
import { CustomerInvoicesList } from '~/components/customers/CustomerInvoicesList'
import { theme, PageHeader, MenuPopper } from '~/styles'
import { SectionHeader } from '~/styles/customer'
import {
  DeleteCustomerDialog,
  DeleteCustomerDialogRef,
} from '~/components/customers/DeleteCustomerDialog'
import { AddCustomerDialog, AddCustomerDialogRef } from '~/components/customers/AddCustomerDialog'
import CountryCodes from '~/public/countryCode.json'

gql`
  fragment CustomerDetails on CustomerDetails {
    id
    name
    customerId
    canBeDeleted
    subscriptions(status: [active, pending]) {
      ...CustomerSubscriptionList
    }
    invoices {
      ...CustomerInvoiceList
    }
    ...AddCustomerDialogDetail
  }

  query getCustomer($id: ID!) {
    customer(id: $id) {
      ...CustomerDetails
    }
  }

  ${CustomerSubscriptionListFragmentDoc}
  ${CustomerInvoiceListFragmentDoc}
  ${AddCustomerDialogDetailFragmentDoc}
`

const formatUrl: (url: string) => string = (url) => {
  if (url.length < 16) return url

  return url.slice(0, 10) + '...' + url.slice(-6)
}

const CustomerDetails = () => {
  const deleteDialogRef = useRef<DeleteCustomerDialogRef>(null)
  const editDialogRef = useRef<AddCustomerDialogRef>(null)
  const subscriptionsListRef = useRef<CustomerSubscriptionsListRef>(null)
  const { translate } = useI18nContext()
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, loading, error, refetch } = useGetCustomerQuery({
    variables: { id: id as string },
    skip: !id,
  })
  const {
    name,
    customerId,
    invoices,
    subscriptions,
    canBeDeleted,
    legalName,
    legalNumber,
    phone,
    email,
    logoUrl,
    url,
    addressLine1,
    addressLine2,
    state,
    country,
    city,
    zipcode,
  } = data?.customer || {}

  return (
    <div>
      <PageHeader $withSide>
        <HeaderLeft>
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
        </HeaderLeft>
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button endIcon="chevron-down">{translate('text_626162c62f790600f850b6fe')}</Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              <Button
                variant="quaternary"
                align="left"
                onClick={() => {
                  subscriptionsListRef?.current?.openAddPlanDialog()
                  closePopper()
                }}
              >
                {translate(
                  !subscriptions?.length
                    ? 'text_626162c62f790600f850b70c'
                    : 'text_6262658ead40f401000bc80f'
                )}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                onClick={() => {
                  editDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_626162c62f790600f850b718')}
              </Button>
              <Tooltip
                placement="bottom-end"
                disableHoverListener={canBeDeleted}
                title={translate('text_6262658ead40f401000bc825')}
              >
                <Button
                  variant="quaternary"
                  align="left"
                  disabled={!canBeDeleted}
                  fullWidth
                  onClick={() => {
                    deleteDialogRef.current?.openDialog()
                    closePopper()
                  }}
                >
                  {translate('text_626162c62f790600f850b726')}
                </Button>
              </Tooltip>
            </MenuPopper>
          )}
        </Popper>
      </PageHeader>
      {(error || !data?.customer) && !loading ? (
        <GenericPlaceholder
          title={translate('text_6250304370f0f700a8fdc270')}
          subtitle={translate('text_6250304370f0f700a8fdc274')}
          buttonTitle={translate('text_6250304370f0f700a8fdc278')}
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<img src={EmojiError} alt="error-emoji" />}
        />
      ) : (
        <>
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

                      <Button
                        variant="secondary"
                        onClick={() => editDialogRef?.current?.openDialog()}
                      >
                        {translate('text_626162c62f790600f850b75a')}
                      </Button>
                    </SectionHeader>

                    <div>
                      <Typography variant="caption">
                        {translate('text_626162c62f790600f850b76a')}
                      </Typography>
                      <Typography color="textSecondary">{name}</Typography>
                    </div>
                    <div>
                      <Typography variant="caption">
                        {translate('text_6250304370f0f700a8fdc283')}
                      </Typography>
                      <Typography color="textSecondary">{customerId}</Typography>
                    </div>
                    {legalName && (
                      <div>
                        <Typography variant="caption">
                          {translate('text_626c0c301a16a600ea061471')}
                        </Typography>
                        <Typography color="textSecondary">{legalName}</Typography>
                      </div>
                    )}
                    {legalNumber && (
                      <div>
                        <Typography variant="caption">
                          {translate('text_626c0c301a16a600ea061475')}
                        </Typography>
                        <Typography color="textSecondary">{legalNumber}</Typography>
                      </div>
                    )}
                    {email && (
                      <div>
                        <Typography variant="caption">
                          {translate('text_626c0c301a16a600ea061479')}
                        </Typography>
                        <Typography color="textSecondary">{email}</Typography>
                      </div>
                    )}
                    {phone && (
                      <div>
                        <Typography variant="caption">
                          {translate('text_626c0c301a16a600ea06147d')}
                        </Typography>
                        <Typography color="textSecondary">{phone}</Typography>
                      </div>
                    )}
                    {url && (
                      <div>
                        <Typography variant="caption">
                          {translate('text_626c0c301a16a600ea061481')}
                        </Typography>
                        <Typography>
                          <a href={url}>{formatUrl(url)}</a>
                        </Typography>
                      </div>
                    )}
                    {logoUrl && (
                      <div>
                        <Typography variant="caption">
                          {translate('text_626c0c301a16a600ea061485')}
                        </Typography>
                        <Typography>
                          <a href={logoUrl}>{formatUrl(logoUrl)}</a>
                        </Typography>
                      </div>
                    )}
                    {(addressLine1 || addressLine2 || state || country || city || zipcode) && (
                      <div>
                        <Typography variant="caption">
                          {translate('text_626c0c301a16a600ea06148d')}
                        </Typography>
                        <Typography color="textSecondary">{addressLine1}</Typography>
                        <Typography color="textSecondary">{addressLine2}</Typography>
                        <Typography color="textSecondary">
                          {zipcode} {city} {state}
                        </Typography>
                        {country && (
                          <Typography color="textSecondary">{CountryCodes[country]}</Typography>
                        )}
                      </div>
                    )}
                  </DetailsBlock>
                  <SideBlock>
                    <CustomerSubscriptionsList
                      ref={subscriptionsListRef}
                      customerName={name as string}
                      customerId={id as string}
                      subscriptions={subscriptions ?? []}
                      refetchCustomer={refetch}
                    />
                    <CustomerInvoicesList invoices={invoices} />
                  </SideBlock>
                </Infos>
              </>
            )}
          </Content>
          <AddCustomerDialog ref={editDialogRef} customer={data?.customer} />
          <DeleteCustomerDialog
            ref={deleteDialogRef}
            onDeleted={() => navigate(CUSTOMERS_LIST_ROUTE)}
            // @ts-ignore
            customer={data?.customer}
          />
        </>
      )}
    </div>
  )
}

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;

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
