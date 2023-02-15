import { useRef } from 'react'
import { gql } from '@apollo/client'
import { useNavigate, useParams, generatePath } from 'react-router-dom'
import styled from 'styled-components'

import {
  Typography,
  Button,
  Skeleton,
  Avatar,
  Popper,
  NavigationTab,
} from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  CUSTOMERS_LIST_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_DETAILS_ROUTE,
} from '~/core/router'
import {
  useGetCustomerQuery,
  SubscriptionItemFragmentDoc,
  AddCustomerDrawerDetailFragmentDoc,
  CustomerCouponFragmentDoc,
  CustomerMainInfosFragmentDoc,
  CustomerAddOnsFragmentDoc,
  CustomerUsageSubscriptionFragmentDoc,
  StatusTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import { CustomerSubscriptionsList } from '~/components/customers/subscriptions/CustomerSubscriptionsList'
import { CustomerWalletsList } from '~/components/wallets/CustomerWalletList'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { CustomerInvoicesTab } from '~/components/customers/CustomerInvoicesTab'
import { CustomerSettings } from '~/components/customers/CustomerSettings'
import { theme, PageHeader, MenuPopper } from '~/styles'
import { SectionHeader } from '~/styles/customer'
import {
  DeleteCustomerDialog,
  DeleteCustomerDialogRef,
} from '~/components/customers/DeleteCustomerDialog'
import { AddCustomerDrawer, AddCustomerDrawerRef } from '~/components/customers/AddCustomerDrawer'
import { CustomerCoupons } from '~/components/customers/CustomerCoupons'
import { CustomerAddOns } from '~/components/customers/CustomerAddOns'
import { CustomerUsage } from '~/components/customers/usage/CustomerUsage'
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
  AddSubscriptionDrawer,
  AddSubscriptionDrawerRef,
} from '~/components/customers/subscriptions/AddSubscriptionDrawer'
import {
  AddWalletToCustomerDialog,
  AddWalletToCustomerDialogRef,
} from '~/components/wallets/AddWalletToCustomerDialog'
import { CustomerCreditNotesList } from '~/components/customers/CustomerCreditNotesList'

gql`
  fragment CustomerSubscription on Subscription {
    id
    plan {
      id
      amountCurrency
    }
    ...SubscriptionItem
    ...CustomerUsageSubscription
  }

  fragment CustomerDetails on CustomerDetails {
    id
    name
    externalId
    hasActiveWallet
    currency
    hasCreditNotes
    creditNotesCreditsAvailableCount
    creditNotesBalanceAmountCents
    applicableTimezone
    subscriptions(status: [active, pending]) {
      ...CustomerSubscription
    }
    appliedCoupons {
      ...CustomerCoupon
    }
    appliedAddOns {
      ...CustomerAddOns
    }
    ...AddCustomerDrawerDetail
    ...CustomerMainInfos
  }

  query getCustomer($id: ID!) {
    customer(id: $id) {
      ...CustomerDetails
    }
  }

  ${SubscriptionItemFragmentDoc}
  ${AddCustomerDrawerDetailFragmentDoc}
  ${CustomerCouponFragmentDoc}
  ${CustomerAddOnsFragmentDoc}
  ${CustomerMainInfosFragmentDoc}
  ${CustomerUsageSubscriptionFragmentDoc}
`

export enum CustomerDetailsTabsOptions {
  creditNotes = 'creditNotes',
  overview = 'overview',
  wallet = 'wallet',
  invoices = 'invoices',
  settings = 'settings',
  usage = 'usage',
}

const CustomerDetails = () => {
  const deleteDialogRef = useRef<DeleteCustomerDialogRef>(null)
  const editDialogRef = useRef<AddCustomerDrawerRef>(null)
  const addCouponDialogRef = useRef<AddCouponToCustomerDialogRef>(null)
  const addOnDialogRef = useRef<AddAddOnToCustomerDialogRef>(null)
  const subscriptionsDialogRef = useRef<AddSubscriptionDrawerRef>(null)
  const addWalletToCustomerDialogRef = useRef<AddWalletToCustomerDialogRef>(null)
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { id, tab } = useParams()
  const { data, loading, error } = useGetCustomerQuery({
    variables: { id: id as string },
    skip: !id,
    notifyOnNetworkStatusChange: true,
  })
  const { goBack } = useLocationHistory()
  const {
    appliedAddOns,
    appliedCoupons,
    creditNotesCreditsAvailableCount,
    creditNotesBalanceAmountCents,
    externalId,
    hasActiveWallet,
    hasCreditNotes,
    name,
    subscriptions,
    applicableTimezone,
  } = data?.customer || {}
  const hasActiveSubscription = !!(subscriptions || [])?.filter(
    (s) => s.status === StatusTypeEnum.Active
  ).length
  const safeTimezone = applicableTimezone || TimezoneEnum.TzUtc

  return (
    <div>
      <PageHeader $withSide>
        <HeaderLeft>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() =>
              goBack(CUSTOMERS_LIST_ROUTE, {
                exclude: [CUSTOMER_DETAILS_TAB_ROUTE, CUSTOMER_DETAILS_ROUTE],
              })
            }
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
            <Button endIcon="chevron-down" data-test="customer-actions">
              {translate('text_626162c62f790600f850b6fe')}
            </Button>
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
                {translate('text_626162c62f790600f850b70c')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                onClick={() => {
                  editDialogRef.current?.openDrawer()
                  closePopper()
                }}
              >
                {translate('text_626162c62f790600f850b718')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
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
                onClick={() => {
                  addCouponDialogRef.current?.openDialog()
                  closePopper()
                }}
                data-test="apply-coupon-action"
              >
                {translate('text_628b8dc14c71840130f8d8a1')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                disabled={!!hasActiveWallet}
                onClick={() => {
                  addWalletToCustomerDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_62d175066d2dbf1d50bc93a5')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                fullWidth
                onClick={() => {
                  deleteDialogRef.current?.openDialog()
                  closePopper()
                }}
              >
                {translate('text_626162c62f790600f850b726')}
              </Button>
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
                  initials={
                    !name ? '-' : name.split(' ').reduce((acc, n) => (acc = acc + n[0]), '')
                  }
                />
                <div>
                  <Name color="textSecondary" variant="headline">
                    {name || translate('text_62f272a7a60b4d7fadad911a')}
                  </Name>
                  <Typography>{externalId}</Typography>
                </div>
              </MainInfos>
            )}

            <Infos>
              <CustomerMainInfos
                loading={loading}
                customer={data?.customer}
                onEdit={editDialogRef.current?.openDrawer}
              />
              <div>
                <NavigationTab
                  align="superLeft"
                  tabs={[
                    {
                      title: translate('text_628cf761cbe6820138b8f2e4'),
                      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                        id,
                        tab: CustomerDetailsTabsOptions.overview,
                      }),
                      routerState: { disableScrollTop: true },
                      match: [
                        generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                          id,
                          tab: CustomerDetailsTabsOptions.overview,
                        }),
                        generatePath(CUSTOMER_DETAILS_ROUTE, {
                          id: id as string,
                        }),
                      ],
                      component: (
                        <SideBlock>
                          {!loading && (
                            <CustomerCoupons
                              coupons={appliedCoupons}
                              customerId={id as string}
                              customerName={data?.customer?.name as string}
                            />
                          )}
                          {!loading && (
                            <CustomerAddOns
                              ref={addOnDialogRef}
                              addOns={appliedAddOns}
                              customerTimezone={safeTimezone}
                            />
                          )}
                          <CustomerSubscriptionsList
                            ref={subscriptionsDialogRef}
                            loading={loading}
                            subscriptions={subscriptions ?? []}
                            customerTimezone={safeTimezone}
                          />
                        </SideBlock>
                      ),
                    },
                    {
                      title: translate('text_62d175066d2dbf1d50bc937c'),
                      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                        id,
                        tab: CustomerDetailsTabsOptions.wallet,
                      }),
                      routerState: { disableScrollTop: true },
                      component: (
                        <SideBlock>
                          <CustomerWalletsList
                            ref={addWalletToCustomerDialogRef}
                            customerId={id as string}
                            customerTimezone={safeTimezone}
                          />
                        </SideBlock>
                      ),
                    },
                    {
                      title: translate('text_62c3f3fca8a1625624e83365'),
                      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                        id,
                        tab: CustomerDetailsTabsOptions.usage,
                      }),
                      routerState: { disableScrollTop: true },
                      hidden: !hasActiveSubscription,
                      component: (
                        <SideBlock>
                          <CustomerUsage
                            id={id as string}
                            subscriptions={subscriptions ?? []}
                            loading={loading}
                            customerTimezone={safeTimezone}
                          />
                        </SideBlock>
                      ),
                    },
                    {
                      title: translate('text_628cf761cbe6820138b8f2e6'),
                      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                        id,
                        tab: CustomerDetailsTabsOptions.invoices,
                      }),
                      routerState: { disableScrollTop: true },
                      component: (
                        <SideBlock>
                          <CustomerInvoicesTab
                            customerId={id as string}
                            customerTimezone={safeTimezone}
                          />
                        </SideBlock>
                      ),
                    },
                    {
                      title: translate('text_63725b30957fd5b26b308dd3'),
                      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                        id,
                        tab: CustomerDetailsTabsOptions.creditNotes,
                      }),
                      routerState: { disableScrollTop: true },
                      hidden: !hasCreditNotes,
                      component: (
                        <SideBlock>
                          <CustomerCreditNotesList
                            customerId={id as string}
                            creditNotesCreditsAvailableCount={creditNotesCreditsAvailableCount}
                            creditNotesBalanceAmountCents={creditNotesBalanceAmountCents}
                            userCurrency={data?.customer?.currency || undefined}
                            customerTimezone={safeTimezone}
                          />
                        </SideBlock>
                      ),
                    },
                    {
                      title: translate('text_638dff9779fb99299bee9126'),
                      link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                        id,
                        tab: CustomerDetailsTabsOptions.settings,
                      }),
                      routerState: { disableScrollTop: true },
                      component: (
                        <SideBlock>
                          <CustomerSettings customerId={id as string} />
                        </SideBlock>
                      ),
                    },
                  ]}
                  loadingComponent={
                    <SideLoadingSection>
                      <SectionHeader variant="subhead">
                        <Skeleton variant="text" height={12} width={200} />
                      </SectionHeader>
                      <Skeleton variant="text" height={12} width={240} />
                    </SideLoadingSection>
                  }
                  loading={
                    ![
                      CustomerDetailsTabsOptions.overview,
                      CustomerDetailsTabsOptions.usage,
                    ].includes(tab as CustomerDetailsTabsOptions) && loading
                  }
                />
              </div>
            </Infos>
          </Content>
          <AddCustomerDrawer ref={editDialogRef} customer={data?.customer} />
          <DeleteCustomerDialog
            ref={deleteDialogRef}
            onDeleted={() => navigate(CUSTOMERS_LIST_ROUTE)}
            // @ts-ignore
            customer={data?.customer}
          />
          <AddCouponToCustomerDialog
            ref={addCouponDialogRef}
            customerId={id as string}
            customerName={data?.customer?.name as string}
          />
          <AddAddOnToCustomerDialog ref={addOnDialogRef} customerId={id as string} />
          <AddSubscriptionDrawer
            ref={subscriptionsDialogRef}
            customerName={name as string}
            customerId={id as string}
            customerTimezone={safeTimezone}
          />
          <AddWalletToCustomerDialog
            customerId={id as string}
            userCurrency={data?.customer?.currency || undefined}
            ref={addWalletToCustomerDialogRef}
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
