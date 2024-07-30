import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  AddCouponToCustomerDialog,
  AddCouponToCustomerDialogRef,
} from '~/components/customers/AddCouponToCustomerDialog'
import {
  AddCustomerDrawer,
  AddCustomerDrawerRef,
} from '~/components/customers/addDrawer/AddCustomerDrawer'
import { CustomerCreditNotesList } from '~/components/customers/CustomerCreditNotesList'
import { CustomerInvoicesTab } from '~/components/customers/CustomerInvoicesTab'
import { CustomerMainInfos } from '~/components/customers/CustomerMainInfos'
import { CustomerSettings } from '~/components/customers/CustomerSettings'
import {
  DeleteCustomerDialog,
  DeleteCustomerDialogRef,
} from '~/components/customers/DeleteCustomerDialog'
import { CustomerOverview } from '~/components/customers/overview/CustomerOverview'
import { CustomerUsage } from '~/components/customers/usage/CustomerUsage'
import {
  Avatar,
  Button,
  NavigationTab,
  Popper,
  Skeleton,
  Typography,
} from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { CustomerWalletsList } from '~/components/wallets/CustomerWalletList'
import { addToast } from '~/core/apolloClient'
import {
  CREATE_INVOICE_ROUTE,
  CREATE_SUBSCRIPTION,
  CREATE_WALLET_ROUTE,
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMERS_LIST_ROUTE,
} from '~/core/router'
import {
  AddCustomerDrawerFragmentDoc,
  CustomerMainInfosFragmentDoc,
  useGenerateCustomerPortalUrlMutation,
  useGetCustomerQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, NAV_HEIGHT, PageHeader, theme } from '~/styles'

gql`
  fragment CustomerDetails on Customer {
    id
    name
    externalId
    hasActiveWallet
    currency
    hasCreditNotes
    creditNotesCreditsAvailableCount
    creditNotesBalanceAmountCents
    applicableTimezone
    ...AddCustomerDrawer
    ...CustomerMainInfos
  }

  query getCustomer($id: ID!) {
    customer(id: $id) {
      ...CustomerDetails
    }
  }

  mutation generateCustomerPortalUrl($input: GenerateCustomerPortalUrlInput!) {
    generateCustomerPortalUrl(input: $input) {
      url
    }
  }

  ${AddCustomerDrawerFragmentDoc}
  ${CustomerMainInfosFragmentDoc}
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
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()
  const { customerId, tab } = useParams()
  const { data, loading, error } = useGetCustomerQuery({
    variables: { id: customerId as string },
    skip: !customerId,
    notifyOnNetworkStatusChange: true,
  })
  const [generatePortalUrl] = useGenerateCustomerPortalUrlMutation({
    onCompleted({ generateCustomerPortalUrl }) {
      if (generateCustomerPortalUrl?.url) {
        // We open a window, add url then focus on different lines, in order to prevent browsers to block page opening
        // It could be seen as unexpected popup as not immediatly done on user action
        // https://stackoverflow.com/questions/2587677/avoid-browser-popup-blockers
        const myWindow = window.open('', '_blank')

        if (myWindow?.location?.href) {
          myWindow.location.href = generateCustomerPortalUrl.url
          return myWindow?.focus()
        }

        myWindow?.close()
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        })
      }
    },
  })
  const {
    creditNotesCreditsAvailableCount,
    creditNotesBalanceAmountCents,
    externalId,
    hasActiveWallet,
    hasCreditNotes,
    name,
    applicableTimezone,
  } = data?.customer || {}
  const safeTimezone = applicableTimezone
  const hasAnyActionsPermission =
    hasPermissions(['subscriptionsCreate']) ||
    hasPermissions(['invoicesCreate']) ||
    hasPermissions(['couponsAttach']) ||
    hasPermissions(['walletsCreate']) ||
    hasPermissions(['customersUpdate']) ||
    hasPermissions(['customersDelete'])

  return (
    <div>
      <PageHeader $withSide>
        <HeaderInlineBreadcrumbBlock>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => navigate(CUSTOMERS_LIST_ROUTE)}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {name}
            </Typography>
          )}
        </HeaderInlineBreadcrumbBlock>
        <HeaderInlineActionsBlock>
          <GoToPortalButton
            startIcon={isPremium ? 'outside' : 'sparkles'}
            variant="quaternary"
            onClick={async () => {
              isPremium
                ? await generatePortalUrl({ variables: { input: { id: customerId as string } } })
                : premiumWarningDialogRef.current?.openDialog()
            }}
          >
            {translate('text_641b1b19d6e64300632ca60c')}
          </GoToPortalButton>

          {hasAnyActionsPermission && (
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
                  {hasPermissions(['subscriptionsCreate']) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        navigate(
                          generatePath(CREATE_SUBSCRIPTION, {
                            customerId: customerId as string,
                          }),
                        )
                        closePopper()
                      }}
                    >
                      {translate('text_626162c62f790600f850b70c')}
                    </Button>
                  )}

                  {hasPermissions(['invoicesCreate']) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        navigate(
                          generatePath(CREATE_INVOICE_ROUTE, { customerId: customerId as string }),
                        )

                        closePopper()
                      }}
                      data-test="create-invoice-action"
                    >
                      {translate('text_6453819268763979024ad083')}
                    </Button>
                  )}

                  {hasPermissions(['couponsAttach']) && (
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
                  )}

                  {hasPermissions(['walletsCreate']) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      disabled={!!hasActiveWallet}
                      onClick={() => {
                        navigate(
                          generatePath(CREATE_WALLET_ROUTE, {
                            customerId: customerId as string,
                          }),
                        )
                        closePopper()
                      }}
                    >
                      {translate('text_62d175066d2dbf1d50bc93a5')}
                    </Button>
                  )}

                  {hasPermissions(['customersUpdate']) && (
                    <Button
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        editDialogRef.current?.openDrawer(data?.customer)
                        closePopper()
                      }}
                    >
                      {translate('text_626162c62f790600f850b718')}
                    </Button>
                  )}

                  {hasPermissions(['customersDelete']) && (
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
                  )}
                </MenuPopper>
              )}
            </Popper>
          )}
        </HeaderInlineActionsBlock>
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
            <CustomerMainInfosContainer>
              <CustomerMainInfos
                loading={loading}
                customer={data?.customer}
                onEdit={() => editDialogRef.current?.openDrawer(data?.customer)}
              />
            </CustomerMainInfosContainer>

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
                  <Name color="textSecondary" variant="headline" forceBreak>
                    {name || translate('text_62f272a7a60b4d7fadad911a')}
                  </Name>
                  <Typography>{externalId}</Typography>
                </div>
              </MainInfos>
            )}

            <StyledTabs data-test="customer-navigation-wrapper">
              <NavigationTab
                tabs={[
                  {
                    title: translate('text_628cf761cbe6820138b8f2e4'),
                    link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                      customerId: customerId as string,
                      tab: CustomerDetailsTabsOptions.overview,
                    }),
                    match: [
                      generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                        customerId: customerId as string,
                        tab: CustomerDetailsTabsOptions.overview,
                      }),
                      generatePath(CUSTOMER_DETAILS_ROUTE, {
                        customerId: customerId as string,
                      }),
                    ],
                    component: (
                      <SideBlock>
                        <CustomerOverview
                          externalCustomerId={externalId}
                          customerTimezone={safeTimezone}
                          userCurrency={data?.customer?.currency || undefined}
                          isLoading={loading}
                        />
                      </SideBlock>
                    ),
                  },
                  {
                    title: translate('text_62d175066d2dbf1d50bc937c'),
                    link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                      customerId: customerId as string,
                      tab: CustomerDetailsTabsOptions.wallet,
                    }),
                    component: (
                      <SideBlock>
                        <CustomerWalletsList
                          customerId={customerId as string}
                          customerTimezone={safeTimezone}
                        />
                      </SideBlock>
                    ),
                  },
                  {
                    title: translate('text_6553885df387fd0097fd7384'),
                    link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                      customerId: customerId as string,
                      tab: CustomerDetailsTabsOptions.usage,
                    }),
                    component: (
                      <SideBlock>
                        <CustomerUsage
                          customerTimezone={safeTimezone}
                          premiumWarningDialogRef={premiumWarningDialogRef}
                        />
                      </SideBlock>
                    ),
                  },
                  {
                    title: translate('text_628cf761cbe6820138b8f2e6'),
                    link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                      customerId: customerId as string,
                      tab: CustomerDetailsTabsOptions.invoices,
                    }),
                    component: (
                      <InvoicesBlock>
                        <CustomerInvoicesTab
                          customerId={customerId as string}
                          customerTimezone={safeTimezone}
                        />
                      </InvoicesBlock>
                    ),
                  },
                  {
                    title: translate('text_63725b30957fd5b26b308dd3'),
                    link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
                      customerId: customerId as string,
                      tab: CustomerDetailsTabsOptions.creditNotes,
                    }),
                    hidden: !hasCreditNotes,
                    component: (
                      <SideBlock>
                        <CustomerCreditNotesList
                          customerId={customerId as string}
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
                      customerId: customerId as string,
                      tab: CustomerDetailsTabsOptions.settings,
                    }),
                    component: (
                      <SideBlock>
                        <CustomerSettings customerId={customerId as string} />
                      </SideBlock>
                    ),
                    hidden: !hasPermissions(['customerSettingsView']),
                  },
                ]}
                loading={
                  ![CustomerDetailsTabsOptions.overview, CustomerDetailsTabsOptions.usage].includes(
                    tab as CustomerDetailsTabsOptions,
                  ) && loading
                }
              />
            </StyledTabs>
          </Content>

          <AddCustomerDrawer ref={editDialogRef} />
          <DeleteCustomerDialog
            ref={deleteDialogRef}
            onDeleted={() => navigate(CUSTOMERS_LIST_ROUTE)}
            // @ts-ignore
            customer={data?.customer}
          />
          <AddCouponToCustomerDialog
            ref={addCouponDialogRef}
            customerId={customerId as string}
            customerName={data?.customer?.name as string}
          />
        </>
      )}

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </div>
  )
}

const HeaderInlineBreadcrumbBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  /* Prevent long name to not overflow in header */
  overflow: hidden;
  /* As overflow is hidden, prevent focus ring to be cropped */
  padding: 4px;
  margin: -4px;
`

const HeaderInlineActionsBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  flex-shrink: 0;
`

const GoToPortalButton = styled(Button)`
  flex-shrink: 0;
`

const Content = styled.div`
  display: grid;
  grid-template-areas:
    'infos'
    'content'
    'details';
  grid-auto-rows: auto;
  grid-gap: ${theme.spacing(8)};
  padding: ${theme.spacing(8)} ${theme.spacing(4)} ${theme.spacing(20)};
  min-height: calc(100vh - ${NAV_HEIGHT}px);
  grid-auto-rows: min-content;

  ${theme.breakpoints.up('md')} {
    padding: ${theme.spacing(8)} ${theme.spacing(12)} ${theme.spacing(20)};
  }

  ${theme.breakpoints.up('lg')} {
    padding: 0 0 0 ${theme.spacing(12)};
    grid-template-columns: minmax(420px, 1fr) minmax(300px, 368px);
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'infos details'
      'content details';
  }
`

const MainInfos = styled.div`
  grid-area: infos;
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(4)};
  }

  ${theme.breakpoints.up('lg')} {
    padding-top: ${theme.spacing(8)};
  }
`

const StyledTabs = styled.div`
  grid-area: content;

  ${theme.breakpoints.up('lg')} {
  }
`

const CustomerMainInfosContainer = styled.div`
  grid-area: details;

  ${theme.breakpoints.up('lg')} {
    box-shadow: ${theme.shadows[8]};
    padding: ${theme.spacing(6)};
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

const InvoicesBlock = styled.div`
  margin-top: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`

export default CustomerDetails
