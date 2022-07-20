import { useRef, useMemo } from 'react'
import { gql } from '@apollo/client'
import { useNavigate, useParams, generatePath } from 'react-router-dom'
import styled from 'styled-components'

import {
  Typography,
  Button,
  Skeleton,
  Avatar,
  Popper,
  Tooltip,
  BasicTabs,
  ButtonLink,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CUSTOMERS_LIST_ROUTE, CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import {
  useGetCustomerQuery,
  CustomerSubscriptionListFragmentDoc,
  CustomerInvoiceListFragmentDoc,
  AddCustomerDialogDetailFragmentDoc,
  CustomerVatRateFragmentDoc,
  CustomerVatRateFragment,
  CustomerCouponFragmentDoc,
  CustomerMainInfosFragmentDoc,
  CustomerAddOnsFragmentDoc,
  StatusTypeEnum,
} from '~/generated/graphql'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import { CustomerSubscriptionsList } from '~/components/customers/CustomerSubscriptionsList'
import { CustomerWalletsList } from '~/components/customers/CustomerWalletList'
import { CustomerInvoicesList } from '~/components/customers/CustomerInvoicesList'
import { CustomerVatRate } from '~/components/customers/CustomerVatRate'
import { theme, PageHeader, MenuPopper } from '~/styles'
import { SectionHeader } from '~/styles/customer'
import {
  DeleteCustomerDialog,
  DeleteCustomerDialogRef,
} from '~/components/customers/DeleteCustomerDialog'
import { AddCustomerDialog, AddCustomerDialogRef } from '~/components/customers/AddCustomerDialog'
import { CustomerCoupons } from '~/components/customers/CustomerCoupons'
import { CustomerAddOns } from '~/components/customers/CustomerAddOns'
import { CustomerUsage } from '~/components/customers/CustomerUsage'
import { CustomerMainInfos } from '~/components/customers/CustomerMainInfos'
import {
  AddCouponToCustomerDialog,
  AddCouponToCustomerDialogRef,
} from '~/components/customers/AddCouponToCustomerDialog'
import {
  AddAddOnToCustomerDialog,
  AddAddOnToCustomerDialogRef,
} from '~/components/customers/AddAddOnToCustomerDialog'
import {
  AddPlanToCustomerDialog,
  AddPlanToCustomerDialogRef,
} from '~/components/customers/AddPlanToCustomerDialog'
import {
  AddWalletToCustomerDialog,
  AddWalletToCustomerDialogRef,
} from '~/components/customers/AddWalletToCustomerDialog'

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
    appliedCoupons {
      ...CustomerCoupon
    }
    appliedAddOns {
      ...CustomerAddOns
    }
    ...CustomerVatRate
    ...AddCustomerDialogDetail
    ...CustomerMainInfos
  }

  query getCustomer($id: ID!) {
    customer(id: $id) {
      ...CustomerDetails
    }
  }

  ${CustomerSubscriptionListFragmentDoc}
  ${CustomerInvoiceListFragmentDoc}
  ${AddCustomerDialogDetailFragmentDoc}
  ${CustomerVatRateFragmentDoc}
  ${CustomerCouponFragmentDoc}
  ${CustomerAddOnsFragmentDoc}
  ${CustomerMainInfosFragmentDoc}
`

enum TabsOptions {
  overview = 'overview',
  wallet = 'wallet',
  invoices = 'invoices',
  taxRate = 'taxRate',
  usage = 'usage',
}

const CustomerDetails = () => {
  const deleteDialogRef = useRef<DeleteCustomerDialogRef>(null)
  const editDialogRef = useRef<AddCustomerDialogRef>(null)
  const addCouponDialogRef = useRef<AddCouponToCustomerDialogRef>(null)
  const addOnDialogRef = useRef<AddAddOnToCustomerDialogRef>(null)
  const subscriptionsDialogRef = useRef<AddPlanToCustomerDialogRef>(null)
  const addWalletToCustomerDialogRef = useRef<AddWalletToCustomerDialogRef>(null)
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { id, tab } = useParams()
  const { data, loading, error, refetch } = useGetCustomerQuery({
    variables: { id: id as string },
    skip: !id,
  })
  const { name, customerId, invoices, subscriptions, canBeDeleted, appliedCoupons, appliedAddOns } =
    data?.customer || {}
  const hasSubscription = !!(subscriptions || []).length
  const selectedPlansId = useMemo(
    () =>
      (subscriptions || []).reduce<string[]>((acc, s) => {
        if ([StatusTypeEnum.Active, StatusTypeEnum.Pending].includes(s.status as StatusTypeEnum)) {
          acc.push(s.plan?.id)
        }
        return acc
      }, []),
    [subscriptions]
  )

  return (
    <div>
      <PageHeader $withSide>
        <HeaderLeft>
          <ButtonLink
            to={CUSTOMERS_LIST_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
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
                  subscriptionsDialogRef?.current?.openDialog()
                  closePopper()
                }}
              >
                {translate(
                  !hasSubscription
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
              <Button
                variant="quaternary"
                align="left"
                disabled={!hasSubscription}
                onClick={() => {
                  addOnDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_6295e58352f39200d902b02a')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                disabled={!hasSubscription || (appliedCoupons || []).length > 0}
                onClick={() => {
                  addCouponDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_628b8dc14c71840130f8d8a1')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                // TODO disabled={wallet?.length > 0}
                onClick={() => {
                  addWalletToCustomerDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_62d175066d2dbf1d50bc93a5')}
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
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
        <>
          <Content>
            {loading ? (
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
            ) : (
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
            )}

            <Infos>
              <CustomerMainInfos
                loading={loading}
                customer={data?.customer}
                onEdit={editDialogRef.current?.openDialog}
              />
              <div>
                <BasicTabs
                  tabs={[
                    {
                      title: translate('text_628cf761cbe6820138b8f2e4'),
                      key: TabsOptions.overview,
                      component: (
                        <SideBlock>
                          <CustomerCoupons coupons={appliedCoupons} />
                          <CustomerAddOns ref={addOnDialogRef} addOns={appliedAddOns} />
                          <CustomerSubscriptionsList
                            ref={subscriptionsDialogRef}
                            subscriptions={subscriptions ?? []}
                          />
                        </SideBlock>
                      ),
                    },
                    {
                      title: translate('text_62d175066d2dbf1d50bc937c'),
                      key: TabsOptions.wallet,
                      component: (
                        <SideBlock>
                          <CustomerWalletsList ref={addWalletToCustomerDialogRef} />
                        </SideBlock>
                      ),
                    },
                    {
                      title: translate('text_62c3f3fca8a1625624e83365'),
                      key: TabsOptions.usage,
                      hidden: !hasSubscription,
                      component: (
                        <SideBlock>
                          <CustomerUsage id={id as string} />
                        </SideBlock>
                      ),
                    },
                    {
                      title: translate('text_628cf761cbe6820138b8f2e6'),
                      key: TabsOptions.invoices,
                      component: (
                        <SideBlock>
                          <CustomerInvoicesList invoices={invoices} />
                        </SideBlock>
                      ),
                    },
                    {
                      title: translate('text_628cf761cbe6820138b8f2e8'),
                      key: TabsOptions.taxRate,
                      component: (
                        <SideBlock>
                          <CustomerVatRate customer={data?.customer as CustomerVatRateFragment} />
                        </SideBlock>
                      ),
                    },
                  ]}
                  value={tab || 0}
                  loading={loading}
                  loadingComponent={
                    <SideLoadingSection>
                      <SectionHeader variant="subhead">
                        <Skeleton variant="text" height={12} width={200} />
                      </SectionHeader>
                      <Skeleton variant="text" height={12} width={240} />
                    </SideLoadingSection>
                  }
                  align="superLeft"
                  onClick={(_, key) =>
                    navigate(generatePath(CUSTOMER_DETAILS_TAB_ROUTE, { id, tab: key as string }), {
                      state: { disableScrollTop: true },
                    })
                  }
                />
              </div>
            </Infos>
          </Content>
          <AddCustomerDialog ref={editDialogRef} customer={data?.customer} />
          <DeleteCustomerDialog
            ref={deleteDialogRef}
            onDeleted={() => navigate(CUSTOMERS_LIST_ROUTE)}
            // @ts-ignore
            customer={data?.customer}
          />
          <AddCouponToCustomerDialog ref={addCouponDialogRef} customerId={id as string} />
          <AddAddOnToCustomerDialog ref={addOnDialogRef} customerId={id as string} />
          <AddPlanToCustomerDialog
            ref={subscriptionsDialogRef}
            customerName={name as string}
            customerId={id as string}
            existingPlanIds={selectedPlansId}
            refetchCustomer={refetch}
          />
          <AddWalletToCustomerDialog customerId={id as string} ref={addWalletToCustomerDialogRef} />
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
    display: flex;
    flex-direction: column;
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

const SideBlock = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`

const SideLoadingSection = styled.div`
  > *:first-child {
    margin-bottom: ${theme.spacing(8)};
  }
`

export default CustomerDetails
